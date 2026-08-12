import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Order, OrderStatus, TrackingUpdate } from "../types";

// Vietnam bounding box for coordinate validation
const VN_LAT_MIN = 8.0;
const VN_LAT_MAX = 23.5;
const VN_LON_MIN = 102.0;
const VN_LON_MAX = 110.0;

function inVietnam(lat: number, lng: number): boolean {
  return (
    lat >= VN_LAT_MIN &&
    lat <= VN_LAT_MAX &&
    lng >= VN_LON_MIN &&
    lng <= VN_LON_MAX
  );
}

// Known incorrect store coordinates that were used before — reject these too.
const WRONG_STORE_LAT = 10.762622;
const WRONG_STORE_LNG = 106.660172;

function isValidStoreCoord(lat: number, lng: number): boolean {
  if (!inVietnam(lat, lng)) return false;
  // Reject the old wrong HCM City coordinates
  if (Math.abs(lat - WRONG_STORE_LAT) < 0.0001 && Math.abs(lng - WRONG_STORE_LNG) < 0.0001) return false;
  return true;
}

// Haversine distance in kilometers between two lat/lng points.
function haversineKm(
  a: [number, number],
  b: [number, number]
): number {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Maximum plausible distance — anything longer is almost certainly bad data
// (Vietnam is ~1700 km tip-to-tip, so a single delivery route should be much shorter).
const MAX_PLAUSIBLE_KM = 600;

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

// ── Routing ──────────────────────────────────────────────────────────────

interface RoutingLayerProps {
  fromPos: [number, number];
  toPos: [number, number];
  color?: string;
  ghostColor?: string;
}

function RoutingLayer({
  fromPos,
  toPos,
  color = "#D94A63",
  ghostColor = "#F28CA6",
}: RoutingLayerProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeError, setRouteError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Guard: skip routing if either endpoint is invalid
  const [fromLat, fromLng] = fromPos;
  const [toLat, toLng] = toPos;
  const coordsValid =
    inVietnam(fromLat, fromLng) &&
    inVietnam(toLat, toLng) &&
    !(fromLat === 0 && fromLng === 0) &&
    !(toLat === 0 && toLng === 0);

  // Reject routes exceeding plausible distance — otherwise OSRM may
  // route through Cambodia/ocean for invalid HCM→Biên Hòa endpoints.
  const dist = coordsValid ? haversineKm(fromPos, toPos) : 0;
  const distPlausible = dist > 0 && dist <= MAX_PLAUSIBLE_KM;

  useEffect(() => {
    if (!coordsValid || !distPlausible) {
      setRouteError(true);
      setRouteCoords(null);
      return;
    }

    setRouteError(false);

    // Hit OSRM directly (public demo server) — returns a GeoJSON LineString.
    // Format: lng,lat pairs (NOT lat,lng) — OSRM uses [lng, lat] order.
    const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
    const url =
      `https://router.project-osrm.org/route/v1/driving/${coords}` +
      `?overview=full&geometries=geojson&alternatives=false&steps=false`;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`OSRM HTTP ${r.status}`);
        return r.json();
      })
      .then((data: {
        code?: string;
        routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>;
      }) => {
        if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
          throw new Error(`OSRM: ${data.code ?? "no route"}`);
        }
        const coords = data.routes[0].geometry.coordinates!;
        if (coords.length < 2) throw new Error("OSRM route too short");
        // GeoJSON is [lng, lat] — flip to [lat, lng] for Leaflet.
        const latlng: [number, number][] = coords.map(([lng, lat]) => [lat, lng]);
        setRouteCoords(latlng);
        setRouteError(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        // eslint-disable-next-line no-console
        console.warn("[MapTracker] OSRM route failed, falling back to straight line:", err);
        setRouteError(true);
        setRouteCoords(null);
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromLat, fromLng, toLat, toLng, coordsValid, distPlausible]);

  // Fallback: straight dashed line when OSRM fails or coords are invalid
  if (routeError || !routeCoords) {
    return <StraightLine from={fromPos} to={toPos} />;
  }

  return (
    <>
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: ghostColor, opacity: 0.5, weight: 8 }}
      />
      <Polyline
        positions={routeCoords}
        pathOptions={{ color, opacity: 0.9, weight: 5 }}
      />
    </>
  );
}

// ── Straight line fallback (no OSRM available) ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StraightLine({ from, to }: { from: [number, number]; to: [number, number] }) {
  const map = useMap();
  const lineRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = (window as any).L;
    if (!L) return;

    // Remove old line
    if (lineRef.current) {
      try {
        map.removeLayer(lineRef.current);
      } catch {
        // ignore
      }
      lineRef.current = null;
    }

    lineRef.current = L.polyline([from, to], {
      color: "#D94A63",
      weight: 3,
      opacity: 0.6,
      dashArray: "8, 8",
    }).addTo(map);

    return () => {
      if (lineRef.current) {
        try {
          map.removeLayer(lineRef.current);
        } catch {
          // ignore
        }
        lineRef.current = null;
      }
    };
  }, [map, from, to]);

  return null;
}

// ── Main export ──────────────────────────────────────────────────────────

// Hardcoded correct store location — used as ultimate fallback regardless of backend config.
// 193 Đỗ Văn Thi, phường Trấn Biên, TP. Biên Hòa, Đồng Nai
const HARDCODED_STORE_LAT = 10.9421;
const HARDCODED_STORE_LNG = 106.8625;

export default function MapTracker({ order, liveUpdate }: MapTrackerProps) {
  const rawCurrentLat = liveUpdate?.current_lat ?? order.current_lat;
  const rawCurrentLng = liveUpdate?.current_lng ?? order.current_lng;
  const status = liveUpdate?.status ?? order.status;

  // Use backend values if they're valid Vietnam coords (and not the known wrong HCM City coords);
  // otherwise fall back to hardcoded correct values.
  const rawStoreLat = liveUpdate?.store_lat ?? order.store_lat;
  const rawStoreLng = liveUpdate?.store_lng ?? order.store_lng;
  const storeLat = isValidStoreCoord(rawStoreLat, rawStoreLng) ? rawStoreLat : HARDCODED_STORE_LAT;
  const storeLng = isValidStoreCoord(rawStoreLat, rawStoreLng) ? rawStoreLng : HARDCODED_STORE_LNG;
  const storeName = liveUpdate?.store_name ?? order.store_name;

  // Snap driver pin to store if coords are bad (out of VN, or known wrong HCM).
  const driverCoordValid = isValidStoreCoord(rawCurrentLat, rawCurrentLng);
  const currentLat = driverCoordValid ? rawCurrentLat : storeLat;
  const currentLng = driverCoordValid ? rawCurrentLng : storeLng;

  const storePos: [number, number] = [storeLat, storeLng];
  const currentPos: [number, number] = [currentLat, currentLng];
  const destPos: [number, number] = [order.delivery_lat, order.delivery_lng];

  // Driver still at the shop means it hasn't picked up yet — hide the driver pin entirely.
  const driverAtStore = driverCoordValid
    && Math.abs(currentLat - storeLat) < 0.0001
    && Math.abs(currentLng - storeLng) < 0.0001;

  // Validate delivery coords; show banner if geocoding failed
  const destValid = inVietnam(destPos[0], destPos[1]) && !(destPos[0] === 0 && destPos[1] === 0);

  const boundsPoints = useMemo<[number, number][]>(() => {
    const points: [number, number][] = [storePos];
    if (!driverAtStore) points.push(currentPos);
    points.push(destPos);
    return points;
  }, [storePos, currentPos, destPos, driverAtStore]);

  const currentStepIndex = STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-6">
      {!destValid && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          ⚠️ Không tìm được vị trí chính xác cho địa chỉ giao hàng. Bản đồ hiển thị vị trí gần đúng.
        </div>
      )}

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

          <RoutingLayer fromPos={storePos} toPos={currentPos} />
          {!driverAtStore && <RoutingLayer fromPos={currentPos} toPos={destPos} />}

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

          {!driverAtStore && (
            <CircleMarker
              center={currentPos}
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
          )}

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
