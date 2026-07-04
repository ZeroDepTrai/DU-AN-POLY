import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { spinApi, type SpinHistoryItem, type WheelConfig } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

interface PrizeDef {
  name: string;
  image?: string;
  weight: number;
  jackpot?: boolean;
  icon?: string;
  coupon_id?: number | null;
  product_id?: number | null;
}

const FALLBACK_PRIZES: PrizeDef[] = [
  { name: "Ma giam gia 2%", weight: 35, icon: "\uD83C\uDF9F\uFE0F" },
  { name: "Cuong Luc", weight: 25, icon: "\uD83D\uDEE1\uFE0F" },
  { name: "Op Iphone", weight: 20, icon: "\uD83D\uDCF1" },
  { name: "Day sac", weight: 14, icon: "\uD83D\uDD0C" },
  { name: "Ma giam gia 5%", weight: 5, icon: "\uD83C\uDF81" },
  { name: "Apple Watch", weight: 0.4, jackpot: true, icon: "\u231A" },
  { name: "IPhone 17 Pro Max", weight: 0.1, jackpot: true, icon: "\uD83D\uDCF1" },
];

const COLORS = ["#101a4d", "#16225e", "#101a4d", "#16225e", "#101a4d", "#16225e", "#101a4d"];

function wrapText2(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineHeight = 20;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lineHeight));
}

function drawWheel(canvas: HTMLCanvasElement, prizes: PrizeDef[]) {
  const LOGICAL_SIZE = 640;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = LOGICAL_SIZE * dpr;
  canvas.height = LOGICAL_SIZE * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const size = LOGICAL_SIZE;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const safe = prizes.length > 0 ? prizes : FALLBACK_PRIZES;
  const n = safe.length;
  const seg = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, size, size);
  safe.forEach((p, i) => {
    const start = -Math.PI / 2 + i * seg;
    const end = start + seg;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    const fillColor = p.jackpot ? "#5a3d0a" : COLORS[i % COLORS.length];
    ctx.fillStyle = fillColor;
    ctx.fill();

    const glossG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    glossG.addColorStop(0, "rgba(255,255,255,0.10)");
    glossG.addColorStop(0.35, "rgba(255,255,255,0.0)");
    ctx.fillStyle = glossG;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(244,197,66,0.4)";
    ctx.stroke();

    if (p.jackpot) {
      [0.3, 0.5, 0.7].forEach((_t, idx) => {
        const ang = start + seg * (0.25 + idx * 0.25);
        const dist = r * (0.35 + (idx % 2) * 0.25);
        const sx = cx + dist * Math.cos(ang);
        const sy = cy + dist * Math.sin(ang);
        ctx.beginPath();
        ctx.arc(sx, sy, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      });
    }

    const mid = start + seg / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const iconY = -r * 0.66;
    ctx.font = "44px -apple-system, Segoe UI Emoji, sans-serif";
    ctx.fillText(p.icon || "\uD83C\uDF81", 0, iconY);
    ctx.font = "600 19px Inter, Segoe UI, sans-serif";
    ctx.fillStyle = "#eef2ff";
    wrapText2(ctx, p.name, 0, -r * 0.4, 96);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(244,197,66,0.55)";
  ctx.stroke();
}

interface ModalPrize {
  name: string;
  image?: string;
  jackpot?: boolean;
  icon?: string;
  coupon_code?: string | null;
  coupon_id?: number | null;
  product_id?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
  reward_type?: string | null;
}

function PrizeModal({ prize, onClose }: { prize: ModalPrize | null; onClose: () => void }) {
  if (!prize) return null;
  const isJackpot = prize.reward_type === "jackpot" || prize.jackpot;
  const isProduct = prize.reward_type === "free_product";
  const isCoupon = prize.reward_type === "coupon" || (!!prize.coupon_code && !isProduct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1442] to-[#05070f] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
        style={isJackpot ? { boxShadow: "0 0 60px rgba(244,197,66,0.45)" } : undefined}
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-crimson">
          {isJackpot ? "Jackpot" : "Vong Quay May Man"}
        </p>
        <p className="mb-6 text-xs font-medium tracking-wide text-white/70">
          {isJackpot
            ? "Phan qua cuc gia tri"
            : isProduct
            ? "San pham tang mien phi"
            : isCoupon
            ? "Ban nhan duoc mot ma giam gia"
            : "Ban da tham gia vong quay"}
        </p>
        <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent ring-2 ring-white/20">
          {isProduct && prize.product_image_url ? (
            <img
              src={prize.product_image_url}
              alt={prize.product_name || ""}
              className="h-[78%] w-[78%] object-contain"
            />
          ) : prize.image ? (
            <img src={prize.image} alt="" className="h-[70%] w-[70%] object-contain" />
          ) : (
            <span className="text-5xl">{prize.icon || "\uD83C\uDF81"}</span>
          )}
        </div>
        <h2
          className={`mb-4 text-2xl font-extrabold ${
            isJackpot
              ? "text-yellow-300"
              : isProduct
              ? "text-emerald-300"
              : isCoupon
              ? "text-pink-300"
              : "text-white"
          }`}
        >
          {prize.name}
        </h2>

        {isProduct && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            Qua tang mien phi — don hang da ghi nhan, ban khong can thanh toan.
          </div>
        )}

        {isCoupon && prize.coupon_code && (
          <div className="mb-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">Ma giam gia cua ban</p>
            <div className="rounded-xl border border-dashed border-pink-400/60 bg-pink-500/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-pink-200">
              {prize.coupon_code}
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              Nhap ma khi thanh toan de duoc giam gia.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-crimson to-rose py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          DONG
        </button>
      </div>
    </div>
  );
}

function HistoryDetailModal({ row, onClose }: { row: SpinHistoryItem | null; onClose: () => void }) {
  if (!row) return null;
  const isProduct = row.reward_type === "free_product";
  const isCoupon = row.reward_type === "coupon" || (!!row.coupon_code && !isProduct);
  const isJackpot = row.reward_type === "jackpot";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur" onClick={onClose}>
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1442] to-[#05070f] p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-crimson">
          {isJackpot ? "Jackpot" : isProduct ? "San pham mien phi" : isCoupon ? "Ma giam gia" : "Qua trung thuong"}
        </p>
        <h2 className="mb-2 text-xl font-extrabold text-white">{row.prize_label}</h2>
        <p className="mb-6 text-xs text-white/60">{new Date(row.created_at).toLocaleString("vi-VN")}</p>

        {isProduct && row.product_id && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p className="mb-1">Ban duoc tang san pham sau:</p>
            <p className="font-bold">{row.product_name || `San pham #${row.product_id}`}</p>
            <p className="mt-1 text-[11px] text-white/60">Don hang da ghi nhan, ban khong can thanh toan.</p>
          </div>
        )}

        {isCoupon && row.coupon_code && (
          <div className="mb-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">Ma giam gia cua ban</p>
            <div className="rounded-xl border border-dashed border-pink-400/60 bg-pink-500/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-pink-200">
              {row.coupon_code}
            </div>
            <p className="mt-2 text-[11px] text-white/50">Ap dung khi thanh toan de giam gia.</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-crimson to-rose py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          DONG
        </button>
      </div>
    </div>
  );
}

const DEFAULT_CFG: WheelConfig = {
  id: 0,
  title: "CellZone - Spin & Win",
  background_url: "",
  prizes: FALLBACK_PRIZES.map((p) => ({
    name: p.name,
    weight: p.weight,
    jackpot: p.jackpot,
    icon: p.icon,
  })),
  spend_per_spin_vnd: 3000000,
  user_credits: 0,
  lifetime_spend_vnd: 0,
};

const SPIN_TIMEOUT_MS = 8000;

export default function Spin() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cfg, setCfg] = useState<WheelConfig | null>(null);
  const [history, setHistory] = useState<SpinHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [modalPrize, setModalPrize] = useState<ModalPrize | null>(null);
  const [detailRow, setDetailRow] = useState<SpinHistoryItem | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(typeof window !== "undefined" && !!localStorage.getItem("token"));

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setCfg((cur) => cur || DEFAULT_CFG);
      setLoading((cur) => {
        if (!cur) return cur;
        setLoadError("API qua cham, hien thi vong quay mac dinh.");
        return false;
      });
    }, SPIN_TIMEOUT_MS);

    (async () => {
      try {
        const { data } = await spinApi.config();
        if (cancelled) return;
        if (data && Array.isArray(data.prizes) && data.prizes.length > 0) {
          setCfg(data as WheelConfig);
        } else {
          setCfg(DEFAULT_CFG);
        }
        setLoadError(null);
      } catch (err: any) {
        if (cancelled) return;
        console.warn("[spin] config fetch failed:", err?.message || err);
        setCfg(DEFAULT_CFG);
        setLoadError("Khong the tai cau hinh vong quay, dang su dung mac dinh.");
      } finally {
        if (!cancelled) {
          window.clearTimeout(timer);
          setLoading(false);
        }
      }
    })();

    if (localStorage.getItem("token")) {
      (async () => {
        try {
          const { data } = await spinApi.history();
          if (!cancelled) setHistory(Array.isArray(data) ? data : []);
        } catch {
          // History is optional — fall back to empty list.
        }
      })();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const prizes: PrizeDef[] = useMemo(() => {
    const list = cfg?.prizes ?? [];
    if (list.length === 0) return FALLBACK_PRIZES;
    return list.map((p, i) => ({
      name: p.name || `Phan qua ${i + 1}`,
      image: p.image || undefined,
      weight: typeof p.weight === "number" ? p.weight : 1,
      jackpot: !!p.jackpot,
      coupon_id: (p as { coupon_id?: number | null }).coupon_id ?? null,
      product_id: (p as { product_id?: number | null }).product_id ?? null,
      icon: p.icon || FALLBACK_PRIZES[i % FALLBACK_PRIZES.length]?.icon || "\uD83C\uDF81",
    }));
  }, [cfg]);

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, prizes);
  }, [prizes]);

  const openLogin = () => {
    setHasToken(!!localStorage.getItem("token"));
  };

  async function refreshConfig() {
    try {
      const { data } = await spinApi.config();
      if (data && Array.isArray(data.prizes) && data.prizes.length > 0) {
        setCfg(data as WheelConfig);
      }
    } catch {
      // ignore — keep current config
    }
  }

  async function refreshHistory() {
    if (!localStorage.getItem("token")) return;
    try {
      const { data } = await spinApi.history();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
  }

  const handleSpin = async () => {
    if (spinning) return;
    setPlayError(null);
    if (!hasToken) {
      setPlayError("Vui long dang nhap de quay thuong.");
      return;
    }
    if (!cfg || cfg.user_credits <= 0) {
      setPlayError("Ban chua co luot quay nao.");
      return;
    }
    setSpinning(true);
    try {
      const resp = await spinApi.play();
      const data = resp.data as {
        prize: {
          name?: string;
          image?: string;
          jackpot?: boolean;
          icon?: string;
          reward_type?: string | null;
          product_id?: number | null;
          product_name?: string | null;
          product_image_url?: string | null;
        };
        spin_id?: number;
        coupon_code?: string | null;
      };
      const prize = data.prize || {};
      const idx = prizes.findIndex((p) => p.name === prize.name);
      if (idx >= 0 && prizes.length > 0) {
        const segDeg = 360 / prizes.length;
        const target = (360 - idx * segDeg - segDeg / 2 + 360 * 6) % 360;
        const current = rotation % 360;
        const delta = ((target - current) + 360) % 360;
        const final = rotation + delta + 360;
        setRotation(final);
        window.setTimeout(() => {
          setModalPrize({
            name: prize.name || "Qua bi mat",
            image: prize.image,
            jackpot: prize.jackpot,
            icon: prize.icon,
            coupon_id: (prize as { coupon_id?: number | null }).coupon_id ?? null,
            product_id: prize.product_id ?? null,
            product_name: prize.product_name ?? null,
            product_image_url: prize.product_image_url ?? null,
            reward_type: prize.reward_type ?? null,
            coupon_code: data.coupon_code ?? null,
          });
          setSpinning(false);
          refreshConfig();
          refreshHistory();
        }, 5600);
      } else {
        setModalPrize({
          name: prize.name || "Qua bi mat",
          image: prize.image,
          jackpot: prize.jackpot,
          icon: prize.icon,
          coupon_id: (prize as { coupon_id?: number | null }).coupon_id ?? null,
          product_id: prize.product_id ?? null,
          product_name: prize.product_name ?? null,
          product_image_url: prize.product_image_url ?? null,
          reward_type: prize.reward_type ?? null,
          coupon_code: data.coupon_code ?? null,
        });
        setSpinning(false);
        refreshConfig();
        refreshHistory();
      }
    } catch (err: any) {
      setSpinning(false);
      const status = err?.response?.status;
      const msg =
        status === 401
          ? "Phien dang nhap het han, vui long dang nhap lai."
          : status === 400
          ? err?.response?.data?.detail || "Ban chua co luot quay."
          : "Da co loi xay ra, vui long thu lai.";
      setPlayError(typeof msg === "string" ? msg : "Da co loi xay ra, vui long thu lai.");
    }
  };

  if (loading && !cfg) {
    return <LoadingSpinner label="Dang tai vong quay..." />;
  }

  const safeCfg = cfg || DEFAULT_CFG;
  const canSpin = hasToken && safeCfg.user_credits > 0 && !spinning;
  const totalWeight = prizes.reduce((s, x) => s + Number(x.weight || 0), 0) || 1;

  return (
    <div className="container-padding section-padding">
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-crimson" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">Vong Quay May Man</span>
          <div className="h-px w-10 bg-crimson" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-warmwhite sm:text-4xl">
          {safeCfg.title || "CellZone - Spin & Win"}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-softgray">
          Moi {new Intl.NumberFormat("vi-VN").format(safeCfg.spend_per_spin_vnd)} VND da mua (don hang da
          giao) = ban nhan <strong className="text-warmwhite">1 luot quay</strong>. Hay quay de trung
          ngay phan qua hap dan!
        </p>

        {loadError && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
            {loadError}
          </div>
        )}

        {!hasToken && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs text-rose">
            Ban can{" "}
            <Link to="/login" onClick={openLogin} className="font-semibold underline">
              dang nhap
            </Link>{" "}
            de tham gia quay thuong.
          </div>
        )}

        {playError && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs text-rose">
            {playError}
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col items-center">
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(47,111,237,0.28), transparent 60%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(244,197,66,0.10), transparent 60%), linear-gradient(180deg, #0d1442, #05070f 75%)",
              padding: 24,
            }}
          >
            <div className="relative mx-auto aspect-square w-full max-w-[440px]">
              <div className="pointer-events-none absolute -inset-3 rounded-full border border-crimson/30" />
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl text-yellow-300 drop-shadow-md">
                &#9660;
              </div>
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={640}
                  className="h-full w-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? "transform 5.6s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleSpin}
                disabled={!canSpin}
                className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-xl font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={
                  canSpin
                    ? {
                        background: "linear-gradient(135deg,#ffedb0 0%,#f4c542 45%,#c8912a 100%)",
                        color: "#241705",
                        boxShadow:
                          "0 0 0 4px #f4c54233, 0 10px 30px rgba(244,197,66,0.45), inset 0 -4px 0 rgba(0,0,0,0.15)",
                      }
                    : { background: "#b91c1c", color: "#fff", boxShadow: "0 6px 20px rgba(185,28,28,0.35)" }
                }
              >
                {spinning ? "..." : !hasToken ? "LOGIN" : safeCfg.user_credits > 0 ? "QUAY" : "HET LUOT"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#93a0c9]">
                Con <strong style={{ color: "#ffedb0" }}>{safeCfg.user_credits}</strong> luot quay. Tong chi
                tieu da giao:{" "}
                <strong className="text-white">
                  {new Intl.NumberFormat("vi-VN").format(safeCfg.lifetime_spend_vnd)} VND
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <h2 className="mb-3 text-base font-bold text-warmwhite">Phan thuong</h2>
            <div className="grid grid-cols-2 gap-2">
              {prizes.map((p, i) => (
                <div
                  key={`${p.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-gunmetal/40 bg-charcoal p-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-graphite text-lg">
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span>{p.icon || "\uD83C\uDF81"}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                    <p className="text-[10px] text-steelgray">
                      xac suat {((Number(p.weight) / totalWeight) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <h2 className="mb-3 text-base font-bold text-warmwhite">Lich su quay</h2>
            {history.length === 0 ? (
              <p className="text-xs text-steelgray">
                {hasToken ? "Ban chua quay lan nao." : "Dang nhap de xem lich su quay."}
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 10).map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => setDetailRow(h)}
                      className="flex w-full items-center justify-between rounded-lg bg-charcoal/60 p-2 text-left text-xs transition-colors hover:bg-charcoal"
                    >
                      <span className="truncate text-warmwhite">{h.prize_label}</span>
                      <span className="text-rose hover:text-sakura">Xem chi tiet &rarr;</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/orders" className="mt-3 block text-center text-xs text-rose hover:text-sakura">
              Xem don hang cua toi &rarr;
            </Link>
          </div>
        </div>
      </div>

      <PrizeModal prize={modalPrize} onClose={() => setModalPrize(null)} />
      <HistoryDetailModal row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}
