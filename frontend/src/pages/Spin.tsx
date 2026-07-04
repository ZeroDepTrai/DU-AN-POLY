import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { spinApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import type { SpinHistoryItem, WheelConfig } from "../api/client";

interface PrizeDef {
  name: string;
  image?: string;
  weight: number;
  jackpot?: boolean;
  icon?: string;
  coupon_id?: number | null;
  product_id?: number | null;
}

const DEFAULT_PRIZE_VIEW: PrizeDef[] = [
  { name: "Mã giảm giá 2%", weight: 35, icon: "🎟️" },
  { name: "Cường Lực", weight: 25, icon: "🛡️" },
  { name: "Ốp Iphone", weight: 20, icon: "📱" },
  { name: "Dây sạc", weight: 14, icon: "🔌" },
  { name: "Mã giảm giá 5%", weight: 5, icon: "🎁" },
  { name: "Chúc bạn may mắn lần sau", weight: 0.5, icon: "🍀" },
  { name: "Apple Watch", weight: 0.4, jackpot: true, icon: "⌚" },
  { name: "IPhone 17 Pro Max", weight: 0.1, jackpot: true, icon: "📱" },
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
  product_id?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
  reward_type?: "coupon" | "free_product" | "consolation" | "jackpot";
  spin_id?: number;
}

function PrizeModal({
  prize,
  onClose,
  onViewDetail,
}: {
  prize: ModalPrize | null;
  onClose: () => void;
  onViewDetail?: () => void;
}) {
  if (!prize) return null;
  const isJackpot = prize.reward_type === "jackpot" || prize.jackpot;
  const isProduct = prize.reward_type === "free_product";
  const isCoupon = prize.reward_type === "coupon" || (!!prize.coupon_code && !isProduct);
  const titleColor = isJackpot
    ? "text-yellow-300"
    : isProduct
      ? "text-emerald-300"
      : isCoupon
        ? "text-pink-300"
        : "text-white";
  const subtitle = isJackpot
    ? "Prizes cực giá trị"
    : isProduct
      ? "Sản phẩm tặng miễn phí"
      : isCoupon
        ? "Bạn nhận được một mã giảm giá"
        : "Bạn đã tham gia vòng quay";
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
          {isJackpot ? "🔥 Jackpot" : "Vòng Quay May Mắn"}
        </p>
        <p className="mb-6 text-xs font-medium tracking-wide text-white/70">{subtitle}</p>
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
            <span className="text-5xl">{prize.icon || "🎁"}</span>
          )}
        </div>
        <h2 className={`mb-4 text-2xl font-extrabold ${titleColor}`}>{prize.name}</h2>

        {isProduct && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            🎁 Quà tặng miễn phí — đơn hàng đã được ghi nhận, bạn không cần thanh toán.
          </div>
        )}

        {isCoupon && prize.coupon_code && (
          <div className="mb-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">Mã giảm giá của bạn</p>
            <div className="rounded-xl border border-dashed border-pink-400/60 bg-pink-500/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-pink-200">
              {prize.coupon_code}
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              Nhập mã khi thanh toán để được giảm giá.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-crimson to-rose py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            ĐÓNG
          </button>
          {onViewDetail && (
            <button
              onClick={onViewDetail}
              className="w-full rounded-2xl border border-white/15 bg-white/5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Xem chi tiết phần thưởng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryDetailModal({
  row,
  onClose,
}: {
  row: SpinHistoryItem | null;
  onClose: () => void;
}) {
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
          {isJackpot ? "🔥 Jackpot" : isProduct ? "🎁 Sản phẩm miễn phí" : isCoupon ? "🎟️ Mã giảm giá" : "Quà trúng thưởng"}
        </p>
        <h2 className="mb-2 text-xl font-extrabold text-white">{row.prize_label}</h2>
        <p className="mb-6 text-xs text-white/60">
          {new Date(row.created_at).toLocaleString("vi-VN")}
        </p>

        {isProduct && row.product_id && (
          <div className="mb-5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <p className="mb-1">Bạn được tặng sản phẩm sau:</p>
            <p className="font-bold">{row.product_name || `Sản phẩm #${row.product_id}`}</p>
            <p className="mt-1 text-[11px] text-white/60">Đơn hàng đã được ghi nhận và bạn không cần thanh toán.</p>
          </div>
        )}

        {isCoupon && row.coupon_code && (
          <div className="mb-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">Mã giảm giá của bạn</p>
            <div className="rounded-xl border border-dashed border-pink-400/60 bg-pink-500/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-pink-200">
              {row.coupon_code}
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              Áp dụng khi thanh toán để được giảm {row.discount_value ? `${row.discount_value}%` : "giá"}.
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-gradient-to-r from-crimson to-rose py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
        >
          ĐÓNG
        </button>
      </div>
    </div>
  );
}

export default function Spin() {
  const queryClient = useQueryClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [modalPrize, setModalPrize] = useState<ModalPrize | null>(null);
  const [detailRow, setDetailRow] = useState<SpinHistoryItem | null>(null);

  const { data: cfg, isLoading } = useQuery<WheelConfig | undefined>({
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
      coupon_id: (p as any).coupon_id ?? null,
      product_id: (p as any).product_id ?? null,
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
      const prize = resp.data.prize;
      const idx = prizes.findIndex((p) => p.name === prize.name);
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
      setTimeout(() => finishModal(resp.data), 5600);
    },
    onError: () => setSpinning(false),
  });

  const finishModal = (resp: any) => {
    setSpinning(false);
    const prize = resp.prize || {};
    const modalPayload: ModalPrize = {
      name: prize.name || "Quà bí mật",
      image: prize.image,
      jackpot: prize.jackpot,
      icon: prize.icon,
      coupon_id: prize.coupon_id ?? null,
      product_id: prize.product_id ?? null,
      product_name: prize.product_name,
      product_image_url: prize.product_image_url,
      reward_type: prize.reward_type,
      coupon_code: resp.coupon_code ?? null,
      spin_id: resp.spin_id,
    };
    setModalPrize(modalPayload);
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
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-rose">
            Vòng Quay May Mắn
          </span>
          <div className="h-px w-10 bg-crimson" />
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-warmwhite sm:text-4xl">
          {cfg.title || "CellZone · Spin & Win"}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-softgray">
          Mỗi {new Intl.NumberFormat("vi-VN").format(cfg.spend_per_spin_vnd)} VND đã mua (đơn hàng đã
          giao) = bạn nhận <strong className="text-warmwhite">1 lượt quay</strong>. Hãy quay để trúng ngay
          phần quà hấp dẫn!
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
            <div className="relative mx-auto aspect-square w-full max-w-[440px]">
              <div className="pointer-events-none absolute -inset-3 rounded-full border border-crimson/30" />
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-3xl text-yellow-300 drop-shadow-md">
                ▼
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
              {/* Solid coloured QUAY button (no Tailwind "cz-gold-*" classes) */}
              <button
                onClick={handleSpin}
                disabled={spinning || cfg.user_credits <= 0}
                className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full font-display text-xl font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60"
                style={
                  cfg.user_credits > 0 && !spinning
                    ? {
                        background: "linear-gradient(135deg,#ffedb0 0%,#f4c542 45%,#c8912a 100%)",
                        color: "#241705",
                        boxShadow:
                          "0 0 0 4px #f4c54233, 0 10px 30px rgba(244,197,66,0.45), inset 0 -4px 0 rgba(0,0,0,0.15)",
                      }
                    : {
                        background: "#b91c1c",
                        color: "#fff",
                        boxShadow: "0 6px 20px rgba(185,28,28,0.35)",
                      }
                }
              >
                {spinning ? "..." : cfg.user_credits > 0 ? "QUAY" : "HẾT LƯỢT"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#93a0c9]">
                Còn <strong style={{ color: "#ffedb0" }}>{cfg.user_credits}</strong> lượt quay.
                Tổng chi tiêu đã giao:{" "}
                <strong className="text-white">
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
                    {p.image ? (
                      <img src={p.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      p.icon || "🎁"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                    <p className="text-[10px] text-steelgray">
                      xác suất{" "}
                      {(
                        (Number(p.weight) /
                          Math.max(1, prizes.reduce((s, x) => s + Number(x.weight), 0))) *
                        100
                      ).toFixed(2)}
                      %
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
                  <li key={h.id}>
                    <button
                      onClick={() => setDetailRow(h)}
                      className="flex w-full items-center justify-between rounded-lg bg-charcoal/60 p-2 text-left text-xs transition-colors hover:bg-charcoal"
                    >
                      <span className="truncate text-warmwhite">{h.prize_label}</span>
                      <span className="text-rose hover:text-sakura">Xem chi tiết →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/orders" className="mt-3 block text-center text-xs text-rose hover:text-sakura">
              Xem đơn hàng của tôi →
            </Link>
          </div>
        </div>
      </div>

      <PrizeModal
        prize={modalPrize}
        onClose={() => setModalPrize(null)}
        onViewDetail={() => {
          setModalPrize(null);
          const row = (history[0] as any) ?? null;
          if (row) setDetailRow(row);
        }}
      />
      <HistoryDetailModal row={detailRow} onClose={() => setDetailRow(null)} />
    </div>
  );
}
