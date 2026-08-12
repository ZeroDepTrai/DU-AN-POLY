import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ordersApi } from "../api/client";
import type { Order, OrderStatus, TrackingUpdate } from "../types";
import GlassCard from "../components/aurora/GlassCard";
import SectionHeading from "../components/aurora/SectionHeading";
import AuroraBadge from "../components/aurora/AuroraBadge";

// ── Constants ────────────────────────────────────────────────────────────

// Vietnam bounding box (used to validate coordinates from the backend).
const VN_LAT_MIN = 8.0;
const VN_LAT_MAX = 23.5;
const VN_LON_MIN = 102.0;
const VN_LON_MAX = 110.0;

// Maximum plausible delivery distance (km). Anything longer than this is almost
// certainly bad geocoding data and would cause OSRM to route through Cambodia.
const MAX_PLAUSIBLE_KM = 600;

// Hardcoded correct store location — 193 Đỗ Văn Thi, Trấn Biên, Biên Hòa, Đồng Nai.
const STORE_LAT = 10.9421;
const STORE_LNG = 106.8625;
const STORE_NAME = "CellZone Biên Hòa";

// Known bad fallback the backend once shipped for store coords — reject these.
const BAD_STORE_LAT = 10.7769; // ≈ HCM City center
const BAD_STORE_LNG = 106.7009;

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: "pending", label: "Đã xác nhận", icon: "📋" },
  { key: "processing", label: "Đang chuẩn bị", icon: "📦" },
  { key: "in_transit", label: "Đang giao", icon: "🚚" },
  { key: "delivered", label: "Đã giao", icon: "✅" },
];

// ── Helpers ──────────────────────────────────────────────────────────────

function inVietnam(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= VN_LAT_MIN &&
    lat <= VN_LAT_MAX &&
    lng >= VN_LON_MIN &&
    lng <= VN_LON_MAX
  );
}

function isValidCoord(lat: number, lng: number): boolean {
  if (!inVietnam(lat, lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

function isValidStoreCoord(lat: number, lng: number): boolean {
  if (!isValidCoord(lat, lng)) return false;
  // Reject the known bad HCM City center coords if they slipped through.
  if (Math.abs(lat - BAD_STORE_LAT) < 0.01 && Math.abs(lng - BAD_STORE_LNG) < 0.01) {
    return false;
  }
  return true;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1 phút";
  const totalMin = Math.round(seconds / 60);
  if (totalMin < 60) return `${totalMin} phút`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} giờ` : `${h} giờ ${m} phút`;
}

const VIETNAM_CENTER: [number, number] = [14.0583, 108.2772];

// ── Map component (inline, no third-party routing libs) ─────────────────

interface RouteInfo {
  coords: [number, number][]; // [lat, lng] for Leaflet
  distanceKm: number;
  durationMin: number;
  source: "osrm" | "straight";
}

interface DeliveryMapProps {
  store: [number, number];
  driver: [number, number];
  destination: [number, number];
  storeName: string;
  driverAtStore: boolean;
  showDriverRoute: boolean;
}

function DeliveryMap({
  store,
  driver,
  destination,
  storeName,
  driverAtStore,
  showDriverRoute,
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    storeMarker: L.Marker | null;
    destMarker: L.Marker | null;
    driverMarker: L.Marker | null;
    storeToDriver: L.Polyline | null;
    storeToDriverGhost: L.Polyline | null;
    driverToDest: L.Polyline | null;
    driverToDestGhost: L.Polyline | null;
  }>({
    storeMarker: null,
    destMarker: null,
    driverMarker: null,
    storeToDriver: null,
    storeToDriverGhost: null,
    driverToDest: null,
    driverToDestGhost: null,
  });
  const abortRef = useRef<AbortController | null>(null);
  const [routes, setRoutes] = useState<{
    storeToDriver: RouteInfo | null;
    driverToDest: RouteInfo | null;
  }>({ storeToDriver: null, driverToDest: null });
  const [routeFailed, setRouteFailed] = useState(false);

  // Build a custom Leaflet icon (no external asset 404s).
  const storeIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:linear-gradient(135deg,#22c55e,#16a34a);
          box-shadow:0 0 0 4px rgba(34,197,94,0.25),0 4px 10px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:18px;border:2px solid white;
        ">🏬</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    []
  );

  const destIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50%;
          background:linear-gradient(135deg,#D94A63,#ff6b8b);
          box-shadow:0 0 0 4px rgba(217,74,99,0.25),0 4px 10px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:18px;border:2px solid white;
        ">🏠</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    []
  );

  const driverIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: `<div style="
          width:36px;height:36px;border-radius:50%;
          background:linear-gradient(135deg,#a855f7,#6366f1);
          box-shadow:0 0 0 4px rgba(168,85,247,0.3),0 4px 12px rgba(0,0,0,0.4);
          display:flex;align-items:center;justify-content:center;
          color:white;font-size:20px;border:2px solid white;
          animation:track-driver-pulse 2s ease-in-out infinite;
        ">🚚</div>
        <style>@keyframes track-driver-pulse{
          0%,100%{box-shadow:0 0 0 4px rgba(168,85,247,0.3),0 4px 12px rgba(0,0,0,0.4);}
          50%{box-shadow:0 0 0 10px rgba(168,85,247,0.1),0 4px 12px rgba(0,0,0,0.4);}
        }</style>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      }),
    []
  );

  // ── Mount the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: VIETNAM_CENTER,
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    // Make sure Leaflet measures correctly after layout settles.
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {
        storeMarker: null,
        destMarker: null,
        driverMarker: null,
        storeToDriver: null,
        storeToDriverGhost: null,
        driverToDest: null,
        driverToDestGhost: null,
      };
    };
  }, []);

  // ── Fetch OSRM routes whenever endpoints change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchRoute = async (
      from: [number, number],
      to: [number, number]
    ): Promise<RouteInfo> => {
      const dist = haversineKm(from, to);
      if (dist === 0) {
        return { coords: [from, to], distanceKm: 0, durationMin: 0, source: "straight" };
      }
      if (dist > MAX_PLAUSIBLE_KM) {
        return { coords: [from, to], distanceKm: dist, durationMin: 0, source: "straight" };
      }
      // OSRM uses [lng, lat] order.
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from[1]},${from[0]};${to[1]},${to[0]}` +
        `?overview=full&geometries=geojson&alternatives=false&steps=false`;
      try {
        const r = await fetch(url, { signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as {
          code?: string;
          routes?: Array<{
            distance?: number; // meters
            duration?: number; // seconds
            geometry?: { coordinates?: [number, number][] };
          }>;
        };
        const route = data.routes?.[0];
        if (data.code !== "Ok" || !route?.geometry?.coordinates) {
          throw new Error(data.code ?? "no route");
        }
        // GeoJSON is [lng, lat] — flip to [lat, lng] for Leaflet.
        const coords: [number, number][] = route.geometry.coordinates.map(
          ([lng, lat]) => [lat, lng]
        );
        if (coords.length < 2) throw new Error("route too short");
        return {
          coords,
          distanceKm: (route.distance ?? dist * 1000) / 1000,
          durationMin: (route.duration ?? 0) / 60,
          source: "osrm",
        };
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          throw err;
        }
        // eslint-disable-next-line no-console
        console.warn("[TrackOrder] OSRM failed, using straight line:", err);
        return { coords: [from, to], distanceKm: dist, durationMin: 0, source: "straight" };
      }
    };

    (async () => {
      try {
        const storeToDriver = await fetchRoute(store, driver);
        let driverToDest: RouteInfo | null = null;
        if (showDriverRoute && !driverAtStore) {
          driverToDest = await fetchRoute(driver, destination);
        }
        if (!controller.signal.aborted) {
          setRoutes({ storeToDriver, driverToDest });
          setRouteFailed(storeToDriver.source === "straight" && storeToDriver.distanceKm > 0);
        }
      } catch {
        // aborted — no-op
      }
    })();

    return () => controller.abort();
  }, [store[0], store[1], driver[0], driver[1], destination[0], destination[1], showDriverRoute, driverAtStore]);

  // ── Draw markers, polylines, and fit bounds whenever inputs change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L_ = layersRef.current;

    // 1) Clear previous drawable layers (markers + polylines).
    [L_.storeMarker, L_.destMarker, L_.driverMarker, L_.storeToDriver, L_.storeToDriverGhost, L_.driverToDest, L_.driverToDestGhost].forEach(
      (layer) => {
        if (layer) {
          try {
            map.removeLayer(layer);
          } catch {
            // ignore
          }
        }
      }
    );
    L_.storeMarker = L_.destMarker = L_.driverMarker = null;
    L_.storeToDriver = L_.storeToDriverGhost = L_.driverToDest = L_.driverToDestGhost = null;

    // 2) Markers.
    L_.storeMarker = L.marker(store, { icon: storeIcon })
      .addTo(map)
      .bindPopup(`<strong>Cửa hàng</strong><br/>${storeName}`);
    L_.destMarker = L.marker(destination, { icon: destIcon })
      .addTo(map)
      .bindPopup(`<strong>Điểm giao hàng</strong>`);

    if (!driverAtStore) {
      L_.driverMarker = L.marker(driver, { icon: driverIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`<strong>Tài xế</strong><br/>Đang trên đường giao hàng`);
    }

    // 3) Polylines.
    const drawRoute = (
      info: RouteInfo | null,
      color: string,
      ghost: string,
      dashed: boolean
    ): { main: L.Polyline | null; ghostLayer: L.Polyline | null } => {
      if (!info || info.coords.length < 2) return { main: null, ghostLayer: null };
      const opts: L.PolylineOptions = dashed
        ? { color, weight: 4, opacity: 0.75, dashArray: "8, 8" }
        : { color, weight: 5, opacity: 0.9 };
      const ghostOpts: L.PolylineOptions = dashed
        ? { color: ghost, weight: 6, opacity: 0.3 }
        : { color: ghost, weight: 9, opacity: 0.45 };
      const main = L.polyline(info.coords, opts).addTo(map);
      const ghostLayer = L.polyline(info.coords, ghostOpts).addTo(map);
      // Ghost goes behind the main line.
      ghostLayer.bringToBack();
      return { main, ghostLayer };
    };

    const a = drawRoute(routes.storeToDriver, "#a855f7", "#c4b5fd", routes.storeToDriver?.source === "straight");
    L_.storeToDriver = a.main;
    L_.storeToDriverGhost = a.ghostLayer;

    if (routes.driverToDest) {
      const b = drawRoute(routes.driverToDest, "#D94A63", "#F28CA6", routes.driverToDest.source === "straight");
      L_.driverToDest = b.main;
      L_.driverToDestGhost = b.ghostLayer;
    }

    // 4) Fit bounds.
    const points: L.LatLngTuple[] = [store, destination];
    if (!driverAtStore) points.push(driver);
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });

    // Make sure sizes are right after layout changes.
    setTimeout(() => map.invalidateSize(), 50);
  }, [
    store[0],
    store[1],
    driver[0],
    driver[1],
    destination[0],
    destination[1],
    driverAtStore,
    routes.storeToDriver,
    routes.driverToDest,
    storeIcon,
    destIcon,
    driverIcon,
  ]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      <div ref={containerRef} style={{ height: 480, width: "100%" }} className="bg-[#0b0d14]" />

      {/* Route info overlay (top-right) */}
      <div className="pointer-events-none absolute right-3 top-3 flex max-w-[220px] flex-col gap-2">
        {routes.driverToDest && routes.driverToDest.distanceKm > 0 && !driverAtStore && (
          <RouteInfoCard
            label="Đến điểm giao"
            distanceKm={routes.driverToDest.distanceKm}
            durationMin={routes.driverToDest.durationMin}
            color="rose"
          />
        )}
        {routes.storeToDriver && routes.storeToDriver.distanceKm > 0 && (
          <RouteInfoCard
            label={driverAtStore ? "Tại cửa hàng" : "Đến tài xế"}
            distanceKm={routes.storeToDriver.distanceKm}
            durationMin={routes.storeToDriver.durationMin}
            color="violet"
          />
        )}
      </div>

      {/* Fallback notice (bottom-left) */}
      {routeFailed && (
        <div className="pointer-events-none absolute bottom-3 left-3 max-w-[280px] rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 backdrop-blur">
          ⚠️ Không tìm được tuyến đường — hiển thị đường thẳng tạm thời.
        </div>
      )}
    </div>
  );
}

function RouteInfoCard({
  label,
  distanceKm,
  durationMin,
  color,
}: {
  label: string;
  distanceKm: number;
  durationMin: number;
  color: "rose" | "violet";
}) {
  const accent =
    color === "rose"
      ? "from-rose/30 to-rose/10 border-rose/40"
      : "from-violet/30 to-violet/10 border-violet/40";
  const text = color === "rose" ? "text-rose" : "text-violet";
  return (
    <div
      className={`pointer-events-auto rounded-xl border bg-gradient-to-br ${accent} px-3 py-2 backdrop-blur-md shadow-lg`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${text}`}>{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-lg font-bold text-warmwhite">{formatKm(distanceKm)}</span>
        {durationMin > 0 && (
          <span className="text-xs text-softgray">~ {formatDuration(durationMin * 60)}</span>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function TrackOrder() {
  const { trackingCode } = useParams<{ trackingCode: string }>();
  const [liveUpdate, setLiveUpdate] = useState<TrackingUpdate | null>(null);

  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ["track", trackingCode],
    queryFn: async () => {
      const { data } = await ordersApi.track(trackingCode!);
      return data;
    },
    enabled: Boolean(trackingCode),
    refetchInterval: 30_000, // poll every 30s as a safety net
  });

  // Live WebSocket updates.
  useEffect(() => {
    if (!trackingCode) return;
    let cancelled = false;
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(`${protocol}://${host}/ws/orders/${trackingCode}`);
      } catch {
        // WS not available — rely on polling.
        return;
      }
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as TrackingUpdate;
          setLiveUpdate(data);
        } catch {
          // ignore malformed
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        reconnectTimer = window.setTimeout(connect, 3000);
      };
      socket.onerror = () => {
        try {
          socket?.close();
        } catch {
          // ignore
        }
      };
    };
    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      try {
        socket?.close();
      } catch {
        // ignore
      }
    };
  }, [trackingCode]);

  // ── Loading state.
  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-sakura border-t-transparent" />
        <p className="mt-4 text-softgray">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <GlassCard intensity="med" glow className="mx-auto max-w-md p-10 text-center">
          <div className="mb-4 text-5xl">😕</div>
          <h2 className="mb-2 text-xl font-bold text-warmwhite">Không tìm thấy đơn hàng</h2>
          <p className="mb-6 text-sm text-steelgray">
            Mã đơn hàng không hợp lệ hoặc đơn hàng đã bị xoá.
          </p>
          <Link
            to="/"
            className="aurora-glow-btn focus-aurora inline-flex items-center gap-2 px-6 py-2.5 text-sm"
          >
            ← Quay về trang chủ
          </Link>
        </GlassCard>
      </div>
    );
  }

  // ── Resolve coordinates.
  const rawStoreLat = liveUpdate?.store_lat ?? order.store_lat;
  const rawStoreLng = liveUpdate?.store_lng ?? order.store_lng;
  const storeValid = isValidStoreCoord(rawStoreLat, rawStoreLng);
  const store: [number, number] = storeValid
    ? [rawStoreLat, rawStoreLng]
    : [STORE_LAT, STORE_LNG];
  const storeName = (liveUpdate?.store_name ?? order.store_name) || STORE_NAME;

  const rawDriverLat = liveUpdate?.current_lat ?? order.current_lat;
  const rawDriverLng = liveUpdate?.current_lng ?? order.current_lng;
  const driverValid = isValidCoord(rawDriverLat, rawDriverLng);
  const driver: [number, number] = driverValid ? [rawDriverLat, rawDriverLng] : store;

  const destinationRaw: [number, number] = [order.delivery_lat, order.delivery_lng];
  const destinationValid = isValidCoord(destinationRaw[0], destinationRaw[1]);
  const destination: [number, number] = destinationValid ? destinationRaw : store;

  const driverAtStore =
    driverValid &&
    Math.abs(driver[0] - store[0]) < 0.0001 &&
    Math.abs(driver[1] - store[1]) < 0.0001;

  const currentStatus: OrderStatus = (liveUpdate?.status ?? order.status) as OrderStatus;

  // For terminal states we still want a graceful map.
  const showDriverRoute =
    currentStatus === "shipped" ||
    currentStatus === "in_transit" ||
    currentStatus === "delivered";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 text-sm text-steelgray transition-colors hover:text-sakura"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Quay về trang chủ
        </Link>

        <SectionHeading
          eyebrow="Theo dõi đơn hàng"
          title={
            <div className="flex flex-wrap items-center gap-3">
              <span>Theo dõi đơn hàng</span>
              <span className="font-mono text-base font-bold aurora-text-rainbow">
                #{order.tracking_code}
              </span>
            </div>
          }
          subtitle="Cập nhật theo thời gian thực qua WebSocket"
        />
      </div>

      {/* ── Status stepper ──────────────────────────────────────────── */}
      <GlassCard intensity="med" className="mb-6 p-6">
        <Stepper currentStatus={currentStatus} />
      </GlassCard>

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <GlassCard intensity="med" className="mb-6 overflow-hidden p-3">
        <DeliveryMap
          store={store}
          driver={driver}
          destination={destination}
          storeName={storeName}
          driverAtStore={driverAtStore}
          showDriverRoute={showDriverRoute}
        />
        <MapLegend
          storeName={storeName}
          driverAtStore={driverAtStore}
          destinationValid={destinationValid}
        />
      </GlassCard>

      {/* ── Order info cards ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          label="Địa chỉ giao hàng"
          value={order.delivery_address}
          tone="sakura"
        />
        <InfoCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
          label="Số điện thoại"
          value={order.delivery_phone}
          tone="violet"
        />
        <InfoCard
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          label="Trạng thái"
          value={
            <AuroraBadge tone={getStatusTone(currentStatus)}>
              {STATUS_STEPS.find((s) => s.key === currentStatus)?.label ?? currentStatus}
            </AuroraBadge>
          }
          tone="mint"
        />
      </div>

      {/* ── Order items ─────────────────────────────────────────────── */}
      {order.items && order.items.length > 0 && (
        <GlassCard intensity="low" className="mt-6 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-steelgray">
            Sản phẩm ({order.items.length})
          </h3>
          <div className="divide-y divide-white/[0.04]">
            {order.items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-warmwhite">{item.product_name}</p>
                  <p className="text-xs text-steelgray">SL: {item.quantity}</p>
                </div>
                <p className="ml-3 text-sm font-semibold aurora-text-rainbow">
                  {new Intl.NumberFormat("vi-VN").format(item.unit_price * item.quantity)} đ
                </p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────

function Stepper({ currentStatus }: { currentStatus: OrderStatus }) {
  // Map real statuses to display steps.
  let activeIndex: number;
  if (currentStatus === "cancelled") activeIndex = -1;
  else if (currentStatus === "delivered") activeIndex = STATUS_STEPS.length - 1;
  else if (currentStatus === "in_transit" || currentStatus === "shipped") activeIndex = 2;
  else if (currentStatus === "processing") activeIndex = 1;
  else activeIndex = 0;

  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="relative">
      {isCancelled && (
        <div className="mb-4 rounded-xl border border-deeprose/40 bg-deeprose/10 px-4 py-2 text-sm text-rose">
          ⚠️ Đơn hàng đã bị huỷ.
        </div>
      )}

      <div className="relative flex items-start justify-between">
        {/* Track */}
        <div className="absolute left-0 right-0 top-5 h-1 -translate-y-1/2 rounded-full bg-white/[0.06]" />
        <div
          className={`absolute left-0 top-5 h-1 -translate-y-1/2 rounded-full transition-all duration-700 ${
            isCancelled
              ? "bg-deeprose/60"
              : "bg-gradient-to-r from-sakura via-rose to-violet shadow-[0_0_12px_rgba(217,74,99,0.5)]"
          }`}
          style={{ width: `${Math.max(0, (activeIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
        />

        {STATUS_STEPS.map((step, i) => {
          const reached = i <= activeIndex && !isCancelled;
          const isCurrent = i === activeIndex && !isCancelled;
          return (
            <div
              key={step.key}
              className="relative z-10 flex w-1/4 flex-col items-center"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg shadow-lg ${
                  reached
                    ? isCurrent
                      ? "bg-aurora-gradient text-white shadow-glow-violet ring-4 ring-sakura/30"
                      : "bg-aurora-gradient text-white"
                    : "border border-white/15 bg-white/[0.04] text-steelgray"
                }`}
              >
                {reached && i < activeIndex ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-base">{step.icon}</span>
                )}
              </div>
              <span
                className={`mt-2 text-center text-xs font-medium ${
                  reached ? "text-warmwhite" : "text-steelgray"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Map legend ──────────────────────────────────────────────────────────

function MapLegend({
  storeName,
  driverAtStore,
  destinationValid,
}: {
  storeName: string;
  driverAtStore: boolean;
  destinationValid: boolean;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-4 px-2 text-xs text-softgray">
      <LegendDot color="bg-gradient-to-br from-green-500 to-green-600" emoji="🏬" label={storeName} />
      {!driverAtStore && (
        <LegendDot color="bg-gradient-to-br from-violet-500 to-indigo-500" emoji="🚚" label="Tài xế" />
      )}
      {destinationValid && (
        <LegendDot color="bg-gradient-to-br from-rose to-pink" emoji="🏠" label="Điểm giao" />
      )}
      <LegendLine color="bg-violet" dashed={false} label="Đường đến tài xế" />
      {destinationValid && (
        <LegendLine color="bg-rose" dashed={false} label="Đường đến điểm giao" />
      )}
    </div>
  );
}

function LegendDot({ color, emoji, label }: { color: string; emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full ${color} text-[10px] text-white shadow`}
      >
        {emoji}
      </span>
      <span>{label}</span>
    </div>
  );
}

function LegendLine({ color, dashed, label }: { color: string; dashed: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`h-0.5 w-6 rounded-full ${dashed ? "opacity-50" : ""} ${color}`}
        style={dashed ? { backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 4px, transparent 4px 8px)" } : undefined}
      />
      <span>{label}</span>
    </div>
  );
}

// ── Info card ───────────────────────────────────────────────────────────

function InfoCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone: "sakura" | "violet" | "mint";
}) {
  const accent =
    tone === "sakura"
      ? "text-sakura"
      : tone === "violet"
      ? "text-violet"
      : "text-mint";
  return (
    <GlassCard intensity="low" className="p-4">
      <div className={`mb-2 flex items-center gap-2 ${accent}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm text-warmwhite">{value}</div>
    </GlassCard>
  );
}

// ── Status tone helper ──────────────────────────────────────────────────

function getStatusTone(currentStatus: OrderStatus): "sakura" | "mint" | "rose" {
  switch (currentStatus) {
    case "delivered":
      return "mint";
    case "in_transit":
    case "shipped":
      return "sakura";
    case "cancelled":
      return "rose";
    case "processing":
      return "sakura";
    default:
      return "sakura";
  }
}