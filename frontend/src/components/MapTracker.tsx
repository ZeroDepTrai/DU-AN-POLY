import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { Order, OrderStatus, TrackingUpdate } from "../types";

const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "in_transit",
  "delivered",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Đã đặt",
  processing: "Đang xử lý",
  shipped: "Đã xuất kho",
  in_transit: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

interface MapTrackerProps {
  order: Order;
  liveUpdate?: TrackingUpdate | null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [50, 50] });
    }
  }, [map, points]);
  return null;
}

function DeliveryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="#D94A63"
      width="32"
      height="32"
    >
      <path d="M3 18h1v2H3v-2zm16 0h1v2h-1v-2zm-15-4a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm10 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm-7-4a3 3 0 1 0 6 0 3 3 0 0 0-6 0zM3 12v4h18v-4H3z" />
      <circle cx="7" cy="18" r="2" fill="#EEE7E8" />
      <circle cx="17" cy="18" r="2" fill="#EEE7E8" />
    </svg>
  );
}

function RoutingLayer({
  storePos,
  destPos,
}: {
  storePos: [number, number];
  destPos: [number, number];
}) {
  const map = useMap();
  const routingControlRef = useRef<unknown>(null);

  useEffect(() => {
    let isMounted = true;

    import("leaflet-routing-machine").then(() => {
      if (!isMounted || !map) return;

      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current as never);
        } catch {
          // ignore
        }
        routingControlRef.current = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !(L as any).Routing) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const control = (L.Routing as any).control({
        waypoints: [L.latLng(storePos), L.latLng(destPos)],
        routeWhileDragging: false,
        draggableWaypoints: false,
        show: false,
        addWaypoints: false,
        lineOptions: {
          styles: [
            { color: "#D94A63", opacity: 0.85, weight: 5 },
            { color: "#F28CA6", opacity: 0.4, weight: 2 },
          ],
          extendToRoute: true,
        },
        createMarker: () => null,
        router: (L.Routing as any).osrmv1({
          serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
      });

      routingControlRef.current = control;
      map.addControl(control);
    });

    return () => {
      isMounted = false;
      if (routingControlRef.current) {
        try {
          map.removeControl(routingControlRef.current as never);
        } catch {
          // ignore
        }
        routingControlRef.current = null;
      }
    };
  }, [map, storePos, destPos]);

  return null;
}

function DeliveryMarker({ position }: { position: [number, number] }) {
  return (
    <CircleMarker
      center={position}
      radius={8}
      pathOptions={{ color: "#D94A63", fillColor: "#D94A63", fillOpacity: 1, weight: 3 }}
    >
      <Popup>
        <div style={{ textAlign: "center", color: "#181417" }}>
          <DeliveryIcon />
          <br />
          <strong>Đang giao hàng</strong>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function MapTracker({ order, liveUpdate }: MapTrackerProps) {
  const currentLat = liveUpdate?.current_lat ?? order.current_lat;
  const currentLng = liveUpdate?.current_lng ?? order.current_lng;
  const status = liveUpdate?.status ?? order.status;
  const storeLat = liveUpdate?.store_lat ?? order.store_lat;
  const storeLng = liveUpdate?.store_lng ?? order.store_lng;
  const storeName = liveUpdate?.store_name ?? order.store_name;

  const storePos: [number, number] = [storeLat, storeLng];
  const currentPos: [number, number] = [currentLat, currentLng];
  const destPos: [number, number] = [order.delivery_lat, order.delivery_lng];

  const boundsPoints = useMemo<[number, number][]>(
    () => [storePos, currentPos, destPos],
    [storePos, currentPos, destPos]
  );

  const currentStepIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-6">
      <div className="h-[420px] overflow-hidden rounded-xl border border-gunmetal/60">
        <MapContainer
          center={currentPos}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={boundsPoints} />

          <RoutingLayer storePos={storePos} destPos={currentPos} />
          <RoutingLayer storePos={currentPos} destPos={destPos} />

          <CircleMarker
            center={storePos}
            radius={10}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.9 }}
          >
            <Popup>
              <div style={{ color: "#181417" }}>
                <strong>Cửa hàng</strong>
                <br />
                {storeName}
              </div>
            </Popup>
          </CircleMarker>

          <DeliveryMarker position={currentPos} />

          <CircleMarker
            center={destPos}
            radius={10}
            pathOptions={{ color: "#F28CA6", fillColor: "#F28CA6", fillOpacity: 0.9 }}
          >
            <Popup>
              <div style={{ color: "#181417" }}>
                <strong>Khách hàng</strong>
                <br />
                {order.delivery_address}
              </div>
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {STATUS_STEPS.map((step, index) => {
          const active = index <= currentStepIndex;
          const completed = index < currentStepIndex;
          return (
            <div key={step} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    completed
                      ? "border-crimson bg-crimson text-white"
                      : active
                      ? "border-crimson bg-crimson/20 text-crimson"
                      : "border-gunmetal bg-charcoal text-steelgray"
                  }`}
                >
                  {completed ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-1.5 whitespace-nowrap text-xs font-medium ${
                    active ? "text-warmwhite" : "text-steelgray"
                  }`}
                >
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 sm:w-12 shrink-0 ${
                    completed ? "bg-crimson" : "bg-gunmetal"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
