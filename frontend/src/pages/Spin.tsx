import { useCart } from "../context/CartContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productsApi, spinApi, type SpinHistoryItem, type WheelConfig, type WheelPrize } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

const FALLBACK_PRIZES: WheelPrize[] = [
  { name: "Mã giảm giá 2%", weight: 35, icon: "🎟️" },
  { name: "Cường Lực miễn phí", weight: 25, icon: "🛡️" },
  { name: "Ốp Iphone miễn phí", weight: 20, icon: "📱" },
  { name: "Dây sạc miễn phí", weight: 14, icon: "🔌" },
  { name: "Mã giảm giá 5%", weight: 5, icon: "🎁" },
  { name: "Chúc bạn may mắn lần sau", weight: 0.5, icon: "🍀" },
  { name: "Apple Watch", weight: 0.4, jackpot: true, icon: "⌚" },
  { name: "IPhone 17 Pro Max", weight: 0.1, jackpot: true, icon: "📱" },
];

const DEFAULT_CFG: WheelConfig = {
  id: 0,
  title: "CellZone · Spin & Win",
  background_url: "",
  prizes: FALLBACK_PRIZES,
  spend_per_spin_vnd: 3_000_000,
  user_credits: 0,
  lifetime_spend_vnd: 0,
};

const SPIN_TIMEOUT_MS = 8000;

function wrapRadialLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
) {
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

function drawWheel(
  canvas: HTMLCanvasElement,
  prizes: WheelPrize[],
  images: Record<string, HTMLImageElement>,
) {
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
    if (p.jackpot) {
      const mid = start + seg / 2;
      const gx = cx + r * Math.cos(mid);
      const gy = cy + r * Math.sin(mid);
      const g = ctx.createLinearGradient(cx, cy, gx, gy);
      g.addColorStop(0, "#5a3d0a");
      g.addColorStop(0.55, "#f4c542");
      g.addColorStop(1, "#fff3cf");
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = i % 2 === 0 ? "#101a4d" : "#16225e";
    }
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

    const img = p.image ? images[p.image] : null;
    const imgSize = p.jackpot ? 72 : 64;
    const imgY = -r * 0.66;
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, -imgSize / 2, imgY - imgSize / 2, imgSize, imgSize);
    } else {
      ctx.font = `${p.jackpot ? 44 : 40}px -apple-system, "Segoe UI Emoji", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(p.icon || "🎁", 0, imgY);
    }

    ctx.font = "600 17px Inter, Segoe UI, sans-serif";
    ctx.fillStyle = "#eef2ff";
    wrapRadialLabel(ctx, p.name || "", 0, -r * 0.40, 92);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(244,197,66,0.55)";
  ctx.stroke();
}

function preloadImages(urls: string[]): Promise<Record<string, HTMLImageElement>> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<{ url: string; img: HTMLImageElement | null }>((resolve) => {
          if (!url) {
            resolve({ url, img: null });
            return;
          }
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ url, img });
          img.onerror = () => resolve({ url, img: null });
          img.src = url;
        }),
    ),
  ).then((entries) => {
    const out: Record<string, HTMLImageElement> = {};
    for (const e of entries) if (e.img) out[e.url] = e.img;
    return out;
  });
}

interface ModalPrize {
  name: string;
  image?: string;
  jackpot?: boolean;
  icon?: string;
  coupon_code?: string | null;
  coupon_discount_type?: string | null;
  coupon_discount_value?: number | null;
  coupon_id?: number | null;
  product_id?: number | null;
  product_name?: string | null;
  product_image_url?: string | null;
  reward_type?: string | null;
  spin_id?: number | null;
}

function PrizeModal({
  prize,
  onClose,
  onViewHistory,
}: {
  prize: ModalPrize | null;
  onClose: () => void;
  onViewHistory: () => void;
}) {
  if (!prize) return null;
  const isJackpot = prize.reward_type === "jackpot" || prize.jackpot;
  const isProduct = prize.reward_type === "free_product" || (!!prize.product_id && !prize.coupon_code);
  const isCoupon = prize.reward_type === "coupon" || (!!prize.coupon_code && !isProduct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-3xl border ${
          isJackpot ? "border-yellow-400/60" : "border-white/10"
        } bg-gradient-to-b from-[#0d1442] to-[#05070f] p-8 text-center`}
        onClick={(e) => e.stopPropagation()}
        style={isJackpot ? { boxShadow: "0 0 60px rgba(244,197,66,0.45)" } : undefined}
      >
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-300">
          {isJackpot ? "Jackpot" : "Vòng Quay May Mắn"}
        </p>
        <p className="mb-6 text-xs font-medium tracking-wide text-white/70">
          {isJackpot
            ? "Phần quà cực giá trị"
            : isProduct
              ? "Sản phẩm tặng miễn phí"
              : isCoupon
                ? "Bạn nhận được một mã giảm giá"
                : "Bạn đã tham gia vòng quay"}
        </p>
        <div
          className={`mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full ring-2 ${
            isJackpot ? "ring-yellow-300/40 bg-yellow-500/10" : "ring-white/20 bg-white/5"
          }`}
        >
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
            Sản phẩm đã được thêm vào giỏ hàng — bạn không cần thanh toán cho sản phẩm này.
          </div>
        )}

        {isJackpot && (
          <div className="mb-5 rounded-xl border border-yellow-400/50 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
            🎉 Chúc mừng bạn trúng <strong>{prize.name}</strong>!<br />
            Vui lòng liên hệ admin qua Zalo hoặc hotline để nhận thưởng.
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
            onClick={onViewHistory}
            className="w-full rounded-2xl bg-gradient-to-r from-rose to-crimson py-3 font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]"
          >
            XEM LỊCH SỬ TRÚNG THƯỞNG
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl border border-white/15 bg-white/5 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function classifyPrize(p: WheelPrize): "coupon" | "free_product" | "jackpot" | "consolation" {
  if (p.reward_type) return p.reward_type as "coupon" | "free_product" | "jackpot" | "consolation";
  if (p.product_id) return "free_product";
  if (p.coupon_id || p.coupon_discount_type || p.coupon_discount_value != null) return "coupon";
  if (p.jackpot) return "jackpot";
  return "consolation";
}

const REWARD_TYPE_LABEL: Record<string, string> = {
  coupon: "Mã giảm giá",
  free_product: "Sản phẩm miễn phí",
  jackpot: "Jackpot",
  consolation: "An ủi",
};

export default function Spin() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { addItem } = useCart();
  const [cfg, setCfg] = useState<WheelConfig | null>(null);
  const [history, setHistory] = useState<SpinHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [modalPrize, setModalPrize] = useState<ModalPrize | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const [prizeImages, setPrizeImages] = useState<Record<string, HTMLImageElement>>({});
  const [hasToken, setHasToken] = useState<boolean>(() => !!localStorage.getItem("token"));

  useEffect(() => {
    let cancelled = false;
    let timedOut = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      timedOut = true;
      setCfg((cur) => cur || DEFAULT_CFG);
      setLoading(false);
      setWarning(
        "API phản hồi chậm — đang hiển thị vòng quay mặc định. Bạn có thể thử tải lại trang sau ít phút.",
      );
    }, SPIN_TIMEOUT_MS);

    (async () => {
      try {
        const { data } = await spinApi.config();
        if (cancelled) return;
        if (data && Array.isArray(data.prizes) && data.prizes.length > 0) {
          setCfg(data as WheelConfig);
          setWarning(null);
        } else {
          setCfg(DEFAULT_CFG);
          setWarning("Vòng quay chưa có phần thưởng — đang hiển thị danh sách mặc định.");
        }
      } catch (err: any) {
        if (cancelled) return;
        console.warn("[spin] config fetch failed:", err?.message || err);
        if (!timedOut) {
          setCfg(DEFAULT_CFG);
          setWarning("Không thể tải cấu hình vòng quay, đang dùng cấu hình mặc định tạm thời.");
        }
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
          // History is optional.
        }
      })();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const prizes: WheelPrize[] = useMemo(() => {
    const list = cfg?.prizes ?? [];
    if (list.length === 0) return FALLBACK_PRIZES;
    return list.map((p, i) => ({
      name: p.name || `Phần quà ${i + 1}`,
      image: p.image || undefined,
      weight: typeof p.weight === "number" ? p.weight : 1,
      jackpot: !!p.jackpot,
      coupon_id: (p as { coupon_id?: number | null }).coupon_id ?? null,
      product_id: (p as { product_id?: number | null }).product_id ?? null,
      coupon_discount_type: (p as { coupon_discount_type?: string | null }).coupon_discount_type ?? null,
      coupon_discount_value: (p as { coupon_discount_value?: number | null }).coupon_discount_value ?? null,
      reward_type: (p as { reward_type?: string | null }).reward_type ?? null,
      icon: p.icon || FALLBACK_PRIZES[i % FALLBACK_PRIZES.length]?.icon || "🎁",
    }));
  }, [cfg]);

  useEffect(() => {
    if (!canvasRef.current) return;
    drawWheel(canvasRef.current, prizes, prizeImages);
  }, [prizes, prizeImages]);

  useEffect(() => {
    const urls = prizes
      .map((p) => p.image)
      .filter((u): u is string => typeof u === "string" && u.length > 0);
    const unique = Array.from(new Set(urls));
    if (unique.length === 0) return;
    let cancelled = false;
    preloadImages(unique).then((loaded) => {
      if (!cancelled) setPrizeImages(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [prizes]);

  async function refreshConfig() {
    try {
      const { data } = await spinApi.config();
      if (data && Array.isArray(data.prizes) && data.prizes.length > 0) {
        setCfg(data as WheelConfig);
        setWarning(null);
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
      setPlayError("Vui lòng đăng nhập để quay thưởng.");
      return;
    }
    if (!cfg || cfg.user_credits <= 0) {
      setPlayError("Bạn chưa có lượt quay nào.");
      return;
    }
    setSpinning(true);
    try {
      const resp = await spinApi.play();
      const data = resp.data;
      const prize = data.prize || {};
      const idx = prizes.findIndex((p) => p.name === prize.name);
      const showModal = async () => {
        setModalPrize({
          name: prize.name || "Quà bí mật",
          image: prize.image,
          jackpot: prize.jackpot,
          icon: prize.icon,
          coupon_id: (prize as { coupon_id?: number | null }).coupon_id ?? null,
          product_id: prize.product_id ?? null,
          product_name: prize.product_name ?? null,
          product_image_url: prize.product_image_url ?? null,
          reward_type: prize.reward_type ?? null,
          coupon_code: data.coupon_code ?? null,
          coupon_discount_type: (prize as { coupon_discount_type?: string | null }).coupon_discount_type ?? null,
          coupon_discount_value: (prize as { coupon_discount_value?: number | null }).coupon_discount_value ?? null,
          spin_id: data.spin_id ?? null,
        });

        if (prize.reward_type === "free_product" && prize.product_id) {
          try {
            const { data: product } = await productsApi.get(prize.product_id);
            if (product) addItem(product);
          } catch {
            // Silently ignore — the prize modal still shows.
          }
        }

        setSpinning(false);
        refreshConfig();
        refreshHistory();
      };
      if (idx >= 0 && prizes.length > 0) {
        const segDeg = 360 / prizes.length;
        const target = (360 - idx * segDeg - segDeg / 2 + 360 * 6) % 360;
        const current = rotation % 360;
        const delta = ((target - current) + 360) % 360;
        const final = rotation + delta + 360;
        setRotation(final);
        window.setTimeout(showModal, 5600);
      } else {
        showModal();
      }
    } catch (err: any) {
      setSpinning(false);
      const status = err?.response?.status;
      const msg =
        status === 401
          ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
          : status === 400
            ? err?.response?.data?.detail || "Bạn chưa có lượt quay."
            : "Đã có lỗi xảy ra, vui lòng thử lại.";
      setPlayError(typeof msg === "string" ? msg : "Đã có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  if (loading && !cfg) {
    return <LoadingSpinner label="Đang tải vòng quay..." />;
  }

  const safeCfg = cfg || DEFAULT_CFG;
  const canSpin = hasToken && safeCfg.user_credits > 0 && !spinning;
  const totalWeight = prizes.reduce((s, x) => s + Number(x.weight || 0), 0) || 1;

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
          {safeCfg.title || "CellZone · Spin & Win"}
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-softgray">
          Mỗi {new Intl.NumberFormat("vi-VN").format(safeCfg.spend_per_spin_vnd)} VND đã mua (đơn hàng đã
          giao) = bạn nhận <strong className="text-warmwhite">1 lượt quay</strong>. Hãy quay để trúng ngay
          phần quà hấp dẫn!
        </p>

        {warning && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-xs text-amber-200">
            {warning}
          </div>
        )}

        {!hasToken && (
          <div className="mx-auto mt-4 max-w-md rounded-xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs text-rose">
            Bạn cần{" "}
            <Link
              to="/login"
              onClick={() => setHasToken(!!localStorage.getItem("token"))}
              className="font-semibold underline"
            >
              đăng nhập
            </Link>{" "}
            để tham gia quay thưởng.
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
                {spinning ? "..." : !hasToken ? "LOGIN" : safeCfg.user_credits > 0 ? "QUAY" : "HẾT LƯỢT"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#93a0c9]">
                Còn <strong style={{ color: "#ffedb0" }}>{safeCfg.user_credits}</strong> lượt quay. Tổng
                chi tiêu đã giao:{" "}
                <strong className="text-white">
                  {new Intl.NumberFormat("vi-VN").format(safeCfg.lifetime_spend_vnd)} VND
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <h2 className="mb-3 text-base font-bold text-warmwhite">Phần thưởng</h2>
            <div className="grid grid-cols-2 gap-2">
              {prizes.map((p, i) => {
                const r = classifyPrize(p);
                const rewardLabel = REWARD_TYPE_LABEL[r];
                return (
                  <div
                    key={`${p.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-gunmetal/40 bg-charcoal p-2"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-graphite">
                      {p.image ? (
                        <img src={p.image} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-lg">{p.icon || "🎁"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-warmwhite">{p.name}</p>
                      <p className="truncate text-[10px] text-steelgray">
                        <span
                          className={
                            r === "jackpot"
                              ? "text-yellow-300"
                              : r === "free_product"
                                ? "text-emerald-300"
                                : r === "coupon"
                                  ? "text-pink-300"
                                  : "text-softgray"
                          }
                        >
                          {rewardLabel}
                        </span>
                        {" · "}
                        {((Number(p.weight) / totalWeight) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-bento border border-rose/20 bg-cardtint/60 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-warmwhite">Lịch sử quay</h2>
              {history.length > 5 && (
                <span className="text-[11px] text-steelgray">5 gần nhất / {history.length} lượt</span>
              )}
            </div>
            <p className="mb-3 text-[11px] text-steelgray">
              Mỗi lượt quay thành công sẽ được lưu ở đây — bấm "Xem tất cả" để xem chi tiết từng giải và mã giảm giá.
            </p>
            {history.length === 0 ? (
              <p className="text-xs text-steelgray">
                {hasToken ? "Bạn chưa quay lần nào." : "Đăng nhập để xem lịch sử quay thưởng của bạn."}
              </p>
            ) : (
              <ul className="space-y-2">
                {history.slice(0, 5).map((h) => (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => navigate("/spin/history")}
                      className="flex w-full items-center justify-between rounded-lg bg-charcoal/60 p-2 text-left text-xs transition-colors hover:bg-charcoal"
                    >
                      <span className="truncate text-warmwhite">{h.prize_label}</span>
                      <span className="text-rose hover:text-sakura">Xem chi tiết →</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/spin/history"
              className="mt-3 block text-center text-xs font-semibold text-rose hover:text-sakura"
            >
              Xem tất cả lịch sử quay →
            </Link>
          </div>
        </div>
      </div>

      <PrizeModal
        prize={modalPrize}
        onClose={() => setModalPrize(null)}
        onViewHistory={() => {
          setModalPrize(null);
          navigate("/spin/history");
        }}
      />
    </div>
  );
}