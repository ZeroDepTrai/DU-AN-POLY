import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import MapTracker from "../components/MapTracker";
import type { TrackingUpdate } from "../types";

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
        <div className="mb-4 text-5xl">
          <svg className="mx-auto h-16 w-16 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-warmwhite">Không tìm thấy đơn hàng</h2>
        <p className="mt-2 text-steelgray">Mã theo dõi không hợp lệ hoặc không tồn tại.</p>
      </div>
    );
  }

  const currentStatus = liveUpdate?.status ?? order.status;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson/10">
              <svg className="h-5 w-5 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-warmwhite">Theo dõi đơn hàng</h1>
          </div>
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

      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gunmetal/60 bg-graphite p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-softgray">Địa chỉ giao hàng</span>
          </div>
          <p className="text-sm text-warmwhite">{order.delivery_address}</p>
        </div>
        <div className="rounded-xl border border-gunmetal/60 bg-graphite p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-4 w-4 text-crimson" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm font-medium text-softgray">Số điện thoại</span>
          </div>
          <p className="text-sm text-warmwhite">{order.delivery_phone}</p>
        </div>
      </div>

      <MapTracker order={order} liveUpdate={liveUpdate} />
    </div>
  );
}
