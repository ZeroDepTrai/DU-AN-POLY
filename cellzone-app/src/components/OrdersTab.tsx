import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/client";
import { useAuthStore } from "../stores/authStore";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { Order, OrderStatus } from "../types";
import { MapPin, Package } from "lucide-react";

// Fix default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  shipped: "#8b5cf6",
  in_transit: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
  shipped: "Đã xuất kho",
  in_transit: "Đang giao hàng",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped", label: "Đã xuất kho" },
  { value: "in_transit", label: "Đang giao hàng" },
  { value: "delivered", label: "Đã giao" },
];

function LocationMarker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function OrdersTab() {
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission("orders:manage");
  const queryClient = useQueryClient();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [position, setPosition] = useState<[number, number]>([10.7769, 106.7009]);
  const [status, setStatus] = useState<OrderStatus>("in_transit");
  const [success, setSuccess] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: ordersApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!selectedOrder) return Promise.reject("No order selected");
      return ordersApi.updateLocation(selectedOrder.id, {
        current_lat: position[0],
        current_lng: position[1],
        status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setPosition([order.current_lat || 10.7769, order.current_lng || 106.7009]);
    setStatus(order.status as OrderStatus);
    setSuccess(false);
  };

  const filtered = orders.filter((o) => !filterStatus || o.status === filterStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f0f5]">Quản lý đơn hàng</h1>
          <p className="text-sm text-[#8b8b9a] mt-1">
            {canManage ? "Quản lý và cập nhật đơn hàng" : "Xem danh sách đơn hàng"}
          </p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-input"
        >
          <option value="">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-3 glass-card overflow-hidden">
          <div className="border-b border-white/10 px-4 py-3">
            <span className="text-sm text-[#8b8b9a]">{filtered.length} đơn hàng</span>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-[#8b8b9a]">Đang tải...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-[#8b8b9a]">Chưa có đơn hàng nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 bg-white/5">
                <tr className="text-left text-[#8b8b9a]">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3">Xem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => selectOrder(order)}
                    className={`cursor-pointer border-t border-white/10 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-indigo-500/10" : "hover:bg-white/5"
                    }`}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-[#f0f0f5]">
                      {order.tracking_code}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${STATUS_COLORS[order.status] || "#8b8b9a"}20`,
                          color: STATUS_COLORS[order.status] || "#8b8b9a",
                        }}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#8b8b9a]">
                      {order.delivery_address}
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-indigo-400 hover:text-indigo-300">Xem →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Order Details & Map */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <h2 className="font-semibold text-[#f0f0f5] flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Cập nhật vị trí giao hàng
          </h2>
          {selectedOrder ? (
            <>
              <div className="p-3 rounded-lg bg-white/5">
                <p className="font-medium text-[#f0f0f5]">{selectedOrder.tracking_code}</p>
                <p className="text-xs text-[#8b8b9a] mt-0.5">{selectedOrder.delivery_address}</p>
              </div>

              <div className="h-48 rounded-xl overflow-hidden border border-white/10">
                <MapContainer
                  center={position}
                  zoom={13}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#8b8b9a] mb-1">Vĩ độ</label>
                  <input
                    type="number"
                    step="any"
                    value={position[0]}
                    onChange={(e) => setPosition([Number(e.target.value), position[1]])}
                    className="glass-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8b8b9a] mb-1">Kinh độ</label>
                  <input
                    type="number"
                    step="any"
                    value={position[1]}
                    onChange={(e) => setPosition([position[0], Number(e.target.value)])}
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              {canManage && (
                <>
                  <div>
                    <label className="block text-xs text-[#8b8b9a] mb-1">Trạng thái</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as OrderStatus)}
                      className="glass-input w-full"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {success && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">
                      Cập nhật thành công!
                    </div>
                  )}

                  <button
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="w-full glass-button py-2.5 text-[#f0f0f5] font-medium disabled:opacity-50"
                  >
                    {updateMutation.isPending ? "Đang cập nhật..." : "Gửi cập nhật"}
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <Package className="w-7 h-7 text-[#8b8b9a]" />
              </div>
              <p className="text-sm text-[#8b8b9a]">
                Chọn một đơn hàng để xem chi tiết
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
