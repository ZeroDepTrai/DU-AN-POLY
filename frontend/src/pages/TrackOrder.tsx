import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import MapTracker from "../components/MapTracker";
import type { TrackingUpdate } from "../types";
import { useEffect, useState } from "react";

const STATUS_STEPS = [
  { key: "pending", label: "Xác nhận" },
  { key: "processing", label: "Đang chuẩn bị" },
  { key: "in_transit", label: "Đang giao" },
  { key: "delivered", label: "Đã giao" },
];

export default function TrackOrder() {
  const { trackingCode } = useParams();
  const [liveUpdate, setLiveUpdate] = useState<TrackingUpdate | null>(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["track", trackingCode],
    queryFn: async () => {
      const { data } = await ordersApi.track(trackingCode!);
      return data;
    },
    enabled: Boolean(trackingCode),
  });

  useEffect(() => {
    if (!trackingCode) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/orders/${trackingCode}`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as TrackingUpdate;
      setLiveUpdate(data);
    };

    return () => socket.close();
  }, [trackingCode]);

  if (isLoading) {
    return <LoadingSpinner label="Đang tải thông tin đơn hàng..." />;
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-warmwhite">Không tìm thấy đơn hàng</h2>
        <Link to="/" className="btn-primary mt-6">Quay về trang chủ</Link>
      </div>
    );
  }

  const currentStatus = liveUpdate?.status ?? order.status;
  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Minimal header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/" className="mb-2 flex items-center gap-1 text-sm text-steelgray hover:text-crimson transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quay về
          </Link>
          <h1 className="text-2xl font-bold text-warmwhite">Theo dõi đơn hàng</h1>
          <p className="mt-1 text-sm text-steelgray">
            Mã theo dõi:{" "}
            <span className="font-mono font-bold text-warmwhite">{order.tracking_code}</span>
          </p>
        </div>
        <div className="rounded-xl border border-gunmetal/60 bg-graphite px-4 py-3 text-right">
          <p className="text-xs text-steelgray">Trạng thái</p>
          <p className="text-base font-bold capitalize text-sakura">
            {currentStatus.replace("_", " ")}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 rounded-2xl border border-gunmetal/60 bg-graphite p-6">
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 bg-gunmetal" />
          <div
            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-crimson transition-all"
            style={{ width: `${Math.max(0, (statusIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
          />
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                  i <= statusIndex
                    ? "border-crimson bg-crimson text-white"
                    : "border-gunmetal bg-graphite text-steelgray"
                }`}
              >
                {i < statusIndex ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-xs font-medium ${i <= statusIndex ? "text-warmwhite" : "text-steelgray"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gunmetal/60 bg-graphite p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-softgray">Địa chỉ giao hàng</span>
          </div>
          <p className="text-sm text-warmwhite">{order.delivery_address}</p>
        </div>
        <div className="rounded-xl border border-gunmetal/60 bg-graphite p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-medium text-softgray">Số điện thoại</span>
          </div>
          <p className="text-sm text-warmwhite">{order.delivery_phone}</p>
        </div>
      </div>

      {/* Map */}
      <MapTracker order={order} liveUpdate={liveUpdate} />
    </div>
  );
}
