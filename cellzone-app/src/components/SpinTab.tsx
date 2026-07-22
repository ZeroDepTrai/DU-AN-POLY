import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { spinApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import type { SpinPrize } from "../types";
import { Plus, Trash2, Settings } from "lucide-react";

export default function SpinTab() {
  const { hasPermission } = useAuthStore();
  const canConfig = hasPermission("spin:configure");
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [prizes, setPrizes] = useState<Partial<SpinPrize>[]>([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data: prizesList = [], isLoading: loadingPrizes } = useQuery({
    queryKey: ["spin-prizes"],
    queryFn: spinApi.listPrizes,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ["spin-results"],
    queryFn: spinApi.listResults,
  });

  const configureMutation = useMutation({
    mutationFn: () => spinApi.configure(prizes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spin-prizes"] });
      setShowForm(false);
      setPrizes([]);
      setSuccess("Cấu hình vòng quay thành công!");
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (e: Error) => setError(e.message),
  });

  const addPrize = () => {
    setPrizes([...prizes, { name: "", probability: 10, active: true }]);
  };

  const removePrize = (index: number) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const updatePrize = (index: number, field: keyof SpinPrize, value: string | number | boolean) => {
    const updated = [...prizes];
    updated[index] = { ...updated[index], [field]: value };
    setPrizes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (prizes.some((p) => !p.name)) {
      setError("Tên giải thưởng không được để trống");
      return;
    }
    configureMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Vòng quay may mắn</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">
            {canConfig ? "Cấu hình và xem kết quả vòng quay" : "Xem kết quả vòng quay"}
          </p>
        </div>
        {canConfig && (
          <button
            onClick={() => { setShowForm(!showForm); }}
            className="glass-button px-4 py-2 flex items-center gap-2 text-[#f0f0f5]"
          >
            <Settings className="w-4 h-4" />
            Cấu hình
          </button>
        )}
      </div>

      {success && <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">{success}</div>}
      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Configuration Form */}
      {showForm && canConfig && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-[#f0f0f5] mb-4">Cấu hình giải thưởng</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {prizes.map((prize, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-[#8b8b9a] mb-1">Tên giải thưởng</label>
                  <input
                    type="text"
                    value={prize.name || ""}
                    onChange={(e) => updatePrize(index, "name", e.target.value)}
                    placeholder="VD: iPhone 15"
                    className="w-full glass-input"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-[#8b8b9a] mb-1">Xác suất (%)</label>
                  <input
                    type="number"
                    value={prize.probability || 10}
                    onChange={(e) => updatePrize(index, "probability", Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full glass-input"
                  />
                </div>
                <button type="button" onClick={() => removePrize(index)} className="text-red-400 hover:text-red-300 p-2">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addPrize} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
              <Plus className="w-4 h-4" />
              Thêm giải thưởng
            </button>
            <button type="submit" className="glass-button px-6 py-2 text-[#f0f0f5] font-medium">
              {configureMutation.isPending ? "Đang lưu..." : "Lưu cấu hình"}
            </button>
          </form>
        </div>
      )}

      {/* Current Prizes */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-medium text-[#f0f0f5]">Giải thưởng hiện tại</h2>
        </div>
        {loadingPrizes ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : prizesList.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có giải thưởng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Giải thưởng</th>
                <th className="px-4 py-3">Xác suất</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {prizesList.map((prize) => (
                <tr key={prize.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-[#f0f0f5]">{prize.name}</td>
                  <td className="px-4 py-3 text-[#8b8b9a]">{prize.probability}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${prize.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {prize.active ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Results */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-medium text-[#f0f0f5]">Kết quả quay gần đây</h2>
        </div>
        {loadingResults ? (
          <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-[#8b8b9a]">Chưa có kết quả nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-left text-[#8b8b9a]">
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Giải thưởng</th>
                <th className="px-4 py-3">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 20).map((result) => (
                <tr key={result.id} className="border-t border-white/10">
                  <td className="px-4 py-3 text-[#f0f0f5]">{result.customer_name}</td>
                  <td className="px-4 py-3 font-medium text-indigo-400">{result.prize_name}</td>
                  <td className="px-4 py-3 text-[#8b8b9a]">{new Date(result.won_at).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
