import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";
import AdminMapPicker from "../../components/AdminMapPicker";
import type { Order, OrderStatus } from "../../types";

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "processing", label: "Đang xử lý" },
  { value: "shipped", label: "Đã xuất kho" },
  { value: "in_transit", label: "Đang giao hàng" },
  { value: "delivered", label: "Đã giao" },
];

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [lat, setLat] = useState<number>(10.7769);
  const [lng, setLng] = useState<number>(106.7009);
  const [status, setStatus] = useState<OrderStatus>("in_transit");
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await adminApi.listOrders();
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminApi.updateLocation(selectedOrder!.id, {
        current_lat: lat,
        current_lng: lng,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    },
  });

  const selectOrder = (order: Order) => {
    setSelectedOrder(order);
    setLat(order.current_lat);
    setLng(order.current_lng);
    setStatus(order.status);
    setUpdateSuccess(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedOrder) return;
    updateMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner label="Đang tải đơn hàng..." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-extrabold text-warmwhite">Quản lý đơn hàng</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 overflow-hidden rounded-xl border border-gunmetal/60 bg-graphite">
          <div className="border-b border-gunmetal/40 px-4 py-3">
            <span className="text-sm font-medium text-steelgray">{orders.length} đơn hàng</span>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-steelgray">Chưa có đơn hàng nào.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gunmetal/40 text-left text-steelgray">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3">Xem</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={`cursor-pointer border-t border-gunmetal/40 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-crimson/10" : "hover:bg-charcoal/40"
                    }`}
                    onClick={() => selectOrder(order)}
                  >
                    <td className="px-4 py-3 font-mono font-medium text-warmwhite">
                      {order.tracking_code}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-crimson/10 px-2 py-0.5 text-xs font-medium capitalize text-crimson">
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-steelgray">
                      {order.delivery_address}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/track/${order.tracking_code}`}
                        className="text-sm text-crimson hover:text-sakura transition-colors"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Theo dõi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <form onSubmit={handleSubmit} className="lg:col-span-2 rounded-xl border border-gunmetal/60 bg-graphite p-6 space-y-4">
          <h2 className="font-bold text-warmwhite">Cập nhật vị trí giao hàng</h2>
          {selectedOrder ? (
            <>
              <div className="rounded-lg border border-gunmetal/40 bg-charcoal p-3 text-sm">
                <p className="font-medium text-warmwhite">
                  Đơn: {selectedOrder.tracking_code}
                </p>
                <p className="text-steelgray text-xs mt-0.5">{selectedOrder.delivery_address}</p>
              </div>

              <AdminMapPicker
                lat={lat}
                lng={lng}
                onChange={(newLat, newLng) => {
                  setLat(newLat);
                  setLng(newLng);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-steelgray">Vĩ độ</label>
                  <input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-steelgray">Kinh độ</label>
                  <input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-steelgray">Trạng thái</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="input-field"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {updateSuccess && (
                <div className="rounded-lg border border-crimson/30 bg-crimson/10 p-3 text-sm text-sakura flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Cập nhật thành công!
                </div>
              )}

              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary w-full disabled:opacity-50"
              >
                {updateMutation.isPending ? "Đang cập nhật..." : "Gửi cập nhật vị trí"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gunmetal/40">
                <svg className="h-7 w-7 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-sm text-steelgray">
                Chọn một đơn hàng để cập nhật vị trí giao hàng.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
