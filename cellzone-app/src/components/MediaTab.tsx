import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, mediaApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { Upload, Image, Trash2 } from "lucide-react";

export default function MediaTab() {
  const { hasPermission } = useAuthStore();
  const canUpload = hasPermission("media:upload");
  const canDelete = hasPermission("media:delete");
  const queryClient = useQueryClient();

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [nextIsCover, setNextIsCover] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.list,
  });

  const { data: media = [], isLoading: loadingMedia } = useQuery({
    queryKey: ["product-media", selectedProductId],
    queryFn: () => mediaApi.list(selectedProductId!),
    enabled: !!selectedProductId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!selectedProductId) return;
      for (const file of Array.from(files)) {
        await mediaApi.upload(selectedProductId, file, nextIsCover);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-media"] });
      setUploading(false);
    },
    onError: () => setUploading(false),
  });

  const setCoverMutation = useMutation({
    mutationFn: (mediaId: number) => mediaApi.setCover(mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-media"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (mediaId: number) => mediaApi.delete(mediaId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["product-media"] }),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    uploadMutation.mutate(files);
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Hình ảnh & Video</h1>
        <p className="text-sm text-[#8b8b9a] mt-1">
          {canUpload ? "Quản lý gallery sản phẩm" : "Xem gallery sản phẩm"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Product List */}
        <div className="glass-card p-4">
          <h2 className="text-sm font-medium text-[#8b8b9a] mb-3">Chọn sản phẩm</h2>
          <div className="max-h-[60vh] overflow-y-auto space-y-1.5">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProductId(p.id)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  selectedProductId === p.id
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <img src={p.image_url} alt="" className="h-9 w-9 rounded-md object-cover" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-medium text-[#f0f0f5] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#5a5a6a]">#{p.id}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Media Gallery */}
        <div className="glass-card p-5">
          {selectedProduct ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#f0f0f5]">{selectedProduct.name}</h2>
                  <p className="text-xs text-[#8b8b9a]">#{selectedProduct.id}</p>
                </div>
                <span className="text-xs text-[#8b8b9a]">{media.length} mục</span>
              </div>

              {canUpload && (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/20 rounded-xl py-8 mb-4 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <Upload className="w-8 h-8 text-[#5a5a6a]" />
                  <span className="text-sm text-[#8b8b9a]">
                    {uploading ? "Đang tải lên..." : "Kéo thả hoặc nhấn để chọn"}
                  </span>
                  <span className="text-[10px] text-[#5a5a6a]">JPG, PNG, WEBP, MP4, WEBM</span>
                  <label className="flex items-center gap-1 text-xs text-[#5a5a6a] mt-1">
                    <input type="checkbox" checked={nextIsCover} onChange={(e) => setNextIsCover(e.target.checked)} className="accent-indigo-500" />
                    Đặt file đầu tiên làm cover
                  </label>
                  <input type="file" accept="image/*,video/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
                </label>
              )}

              {loadingMedia ? (
                <div className="text-center text-[#8b8b9a] py-8">Đang tải...</div>
              ) : media.length === 0 ? (
                <div className="text-center text-[#8b8b9a] py-8 border border-dashed border-white/10 rounded-xl">
                  Chưa có ảnh/video nào cho sản phẩm này.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {media.map((m) => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
                      <div className="aspect-square">
                        {m.media_type === "video" ? (
                          <video src={m.url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img src={m.url} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      {m.is_cover && (
                        <span className="absolute left-2 top-2 rounded-full bg-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Cover
                        </span>
                      )}
                      {m.media_type === "video" && (
                        <span className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#0a0a0f]">
                          Video
                        </span>
                      )}
                      {canUpload && !m.is_cover && (
                        <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setCoverMutation.mutate(m.id)} className="rounded-lg bg-indigo-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-indigo-400">
                            Cover
                          </button>
                        </div>
                      )}
                      {canDelete && (
                        <button onClick={() => { if (confirm("Xóa hình ảnh/video này?")) deleteMutation.mutate(m.id); }} className="absolute right-2 bottom-2 rounded-lg bg-red-500 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Image className="w-12 h-12 text-[#5a5a6a] mb-3" />
              <p className="text-[#8b8b9a]">Chọn một sản phẩm bên trái để xem gallery</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
