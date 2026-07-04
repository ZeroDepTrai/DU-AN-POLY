import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { spinApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

interface PrizeDef {
  name: string;
  image?: string;
  weight: number;
  jackpot?: boolean;
  icon?: string;
  color?: string;
  coupon_id?: number | null;
}

const DEFAULT_PRIZE_VIEW: PrizeDef[] = [
  { name: "Mã giảm giá 2%", weight: 35, color: "#0d1442", icon: "🎟️" },
  { name: "Cường Lực", weight: 25, color: "#16225e", icon: "🛡️" },
  { name: "Ốp Iphone", weight: 20, color: "#0d1442", icon: "📱" },
  { name: "Dây sạc", weight: 14, color: "#16225e", icon: "🔌" },
  { name: "Mã giảm giá 5%", weight: 5, color: "#0d1442", icon: "🎁" },
  { name: "Chúc bạn may mắn lần sau", weight: 0.5, color: "#16225e", icon: "🍀" },
  { name: "Apple Watch", weight: 0.4, jackpot: true, color: "#5a3d0a", icon: "⌚" },
  { name: "IPhone 17 Pro Max", weight: 0.1, jackpot: true, color: "#f4c542", icon: "📱" },
];

const COLORS = ["#101a4d", "#16225e", "#101a4d", "#16225e", "#101a4d", "#16225e", "#101a4d", "#16225e"];

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
  const n = prizes.length;
  const seg = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, size, size);
  prizes.forEach((p, i) => {
    const start = -Math.PI / 2 + i * seg;
    const end = start + seg;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    const fillColor = p.jackpot ? "#5a3d0a" : COLORS[i % COLORS.length];
    ctx.fillStyle = fillColor;
    ctx.fill();

    // glossy sheen
    const glossG = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    glossG.addColorStop(0, "rgba(255,255,255,0.10)");
    glossG.addColorStop(0.35, "rgba(255,255,255,0.0)");
    ctx.fillStyle = glossG;
    ctx.fill();

    // divider
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(244,197,66,0.4)";
    ctx.stroke();

    // jackpot sparkle
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

    // icon + label
    const mid = start + seg / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid + Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const iconY = -r * 0.66;
    ctx.font = "44px -apple-system, Segoe UI Emoji, sans-serif";
    ctx.fillText(p.icon || "🎁", 0, iconY);
    ctx.font = "600 19px Inter, Segoe UI, sans-serif";
    ctx.fillStyle = "#eef2ff";
    wrapText2(ctx, p.name, 0, -r * 0.40, 96);
    ctx.restore();
  });

  // outer rim
  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(244,197,66,0.55)";
  ctx.stroke();
}

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

interface ModalPrize {
  name: string;
  image?: string;
  jackpot?: boolean;
  icon?: string;
  coupon_code?: string | null;
  coupon_id?: number | null;
}

function PrizeModal({ prize, onClose }: { prize: ModalPrize | null; onClose: () => void }) {
  if (!prize) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/80 p-4 backdrop-blur" onClick={onClose}>
      <div
        className={`relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-cz-bg-mid to-cz-bg-deep p-8 text-center ${
          prize.jackpot ? "shadow-glow" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cz-gold">Quá mới đã trúng</p>
        <h2 className="mb-6 font-display text-2xl font-bold text-cz-text">Chúc Mừng Bạn!</h2>
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent bg-cz-blue text-5xl">
          {prize.image ? <img src={prize.image} alt="" className="h-[70%] w-[70%] object-contain" /> : <span>{prize.icon || "🎁"}</span>}
        </div>
        <p className="mb-8 font-display text-2xl font-bold text-cz-text">{prize.name}</p>
        {prize.coupon_code && (
          <p className="mb-6 rounded-xl bg-emerald/10 p-3 text-sm text-emerald">
            Mã của bạn: <span className="font-mono font-bold">{prize.coupon_code}</span>
          </p>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-cz-blue to-cz-blue-soft py-3 font-semibold text-white shadow-lg hover:scale-[1.02] transition-transform"
        >
          NHẬN THƯỞNG NGAY
        </button>
      </div>
      <style>{`
        .cz-bg-deep { background-color: #05070f; }
        .cz-bg-mid { background-color: #0d1442; }
        .cz-blue { background-color: #2f6fed; }
        .cz-blue-soft { background-color: #6ea1ff; }
        .cz-gold { color: #f4c542; }
        .cz-text { color: #eef2ff; }
      `}</style>
    </div>
  );
}

export default function Spin() {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [modalPrize, setModalPrize] = useState<ModalPrize | null>(null);

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["spin-config"],
    queryFn: async () => {
      const { data } = await spinApi.config();
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["spin-history"],
    queryFn: async () => {
      const { data } = await spinApi.history();
      return data;
    },
  });

  // Draw the wheel whenever the prizes list changes.
  const prizes: PrizeDef[] = useMemo(() => {
    if (!cfg || cfg.prizes.length === 0) return DEFAULT_PRIZE_VIEW;
    return cfg.prizes.map((p, i) => ({
      name: p.name,
      image: p.image || undefined,
      weight: p.weight,
      jackpot: p.jackpot,
      coupon_id: p.coupon_id ?? null,
      icon: DEFAULT_PRIZE_VIEW[i]?.icon ?? "🎁",
    }));
  }, [cfg]);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawWheel(canvasRef.current, prizes);
  }, [prizes]);

  const playMutation = useMutation({
    mutationFn: () => spinApi.play(),
    onSuccess: (resp) => {
      // Rotate to the prize index.
      const idx = prizes.findIndex((p) => p.name === resp.data.prize.name);
      if (idx < 0) {
        finishModal(resp.data);
        return;
      }
      const segDeg = 360 / prizes.length;
      const target = (360 - idx * segDeg - segDeg / 2 + 360 * 6) % 360;
      const current = rotation % 360;
      const delta = ((target - current) + 360) % 360;
      const final = rotation + delta + 360;
      setRotation(final);
      setTimeout(() => finishModal(resp.data, final), 5600);
    },
    onError: () => setSpinning(false),
  });

  const finishModal = (prize: any, _rotation?: number) => {
    setSpinning(false);
    setModalPrize(prize);
    queryClient.invalidateQueries({ queryKey: ["spin-config"] });
  };

  const handleSpin = () => {
    if (spinning || playMutation.isPending) return;
    if (!cfg || cfg.user_credits <= 0) return;
    setSpinning(true);
    playMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner label="Đang tải vòng quay..." />;
  }
  if (!cfg) {
    return <div className="py-20 text-center text-steelgray">Vòng quay chưa sẵn sàng.</div>;
  }

  return (
    <div className="container-padding section-padding">
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="h-px w-10 bg-crimson" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">Vòng Quay May Mắn</span>
          <div className="h-px w-10 bg-crimson" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-warmwhite sm:text-4xl">{cfg.title || "CellZone · Spin & Win"}</h1>
        <p className="mx-auto max-w-2xl text-sm text-softgray">
          Mỗi {new Intl.NumberFormat("vi-VN").format(cfg.spend_per_spin_vnd)} VND đã mua (đơn hàng đã giao) =
          bạn nhận <strong className="text-warmwhite">1 lượt quay</strong>. Hãy quay để trúng ngay phần quà hấp dẫn!
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Wheel */}
        <div className="flex flex-col items-center">
          <div
            className="relative w-full max-w-[520px] overflow-hidden rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(47,111,237,0.28), transparent 60%), radial-gradient(ellipse 70% 50% at 50% 100%, rgba(244,197,66,0.10), transparent 60%), linear-gradient(180deg, #0d1442, #05070f 75%)",
              padding: 24,
            }}
          >
            {/* Bulbs ring (purely decorative) */}
            <div className="relative mx-auto aspect-square w-full max-w-[440px]">
              <div className="pointer-events-none absolute -inset-3 rounded-full border border-crimson/30" />
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl text-cz-gold drop-shadow-md">▼</div>
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
                onClick={handleSpin}
                disabled={spinning || cfg.user_credits <= 0}
                className={`absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-xl font-bold text-[#241705] shadow-glow ${
                  cfg.user_credits > 0 && !spinning
                    ? "bg-gradient-to-br from-cz-gold-light via-cz-gold to-cz-gold-deep hover:scale-105"
                    : "bg-crimson text-white opacity-80"
                } transition-all`}
              >
                {spinning ? "..." : cfg.user_credits > 0 ? "QUAY" : "HẾT LƯỢT"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-cz-text-muted">
                Còn <strong className="text-cz-gold-light">{cfg.user_credits}</strong> lượt quay.
                Tổng chi tiêu đã giao:{" "}
                <strong className="text-cz-text">
                  {new Intl.NumberFormat("vi-VN").format(cfg.lifetime_spend_vnd)} VND
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* Side: rewards + history */}
        <div className="space-y-6">
          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <h2 className="mb-3 text-base font-bold text-warmwhite">Phần thưởng</h2>
            <div className="grid grid-cols-2 gap-2">
              {prizes.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-gunmetal/40 bg-charcoal p-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-graphite text-lg">
                    {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain" /> : p.icon || "🎁"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                    <p className="text-[10px] text-steelgray">
                      xác suất {((Number(p.weight) / Math.max(1, prizes.reduce((s, x) => s + Number(x.weight), 0))) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <h2 className="mb-3 text-base font-bold text-warmwhite">Lịch sử quay</h2>
            {history.length === 0 ? (
              <p className="text-xs text-steelgray">Bạn chưa quay lần nào.</p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 10).map((h) => (
                  <li key={h.id} className="flex items-center justify-between rounded-lg bg-charcoal/60 p-2 text-xs">
                    <span className="text-warmwhite truncate">{h.prize_label}</span>
                    <div className="flex items-center gap-2">
                      {h.coupon_code && (
                        <span className="rounded bg-emerald/15 px-2 py-0.5 font-mono text-[10px] text-emerald">
                          {h.coupon_code}
                        </span>
                      )}
                      <span className="text-steelgray">
                        {new Date(h.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/orders"
              className="mt-3 block text-center text-xs text-rose hover:text-sakura"
            >
              Xem đơn hàng của tôi →
            </Link>
          </div>
        </div>
      </div>

      <PrizeModal prize={modalPrize} onClose={() => setModalPrize(null)} />

      <style>{`
        .cz-bg-deep { background-color: #05070f; }
        .cz-bg-mid { background-color: #0d1442; }
        .cz-blue { background-color: #2f6fed; }
        .cz-blue-soft { background-color: #6ea1ff; }
        .cz-gold { color: #f4c542; }
        .cz-gold-light { color: #ffedb0; }
        .cz-gold-deep { color: #c8912a; }
        .cz-text { color: #eef2ff; }
        .cz-text-muted { color: #93a0c9; }
      `}</style>
    </div>
  );
}
