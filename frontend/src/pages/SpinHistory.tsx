import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { spinApi, type SpinHistoryItem } from "../api/client";
import { useAuth } from "../context/AuthContext";

type Filter = "all" | "coupon" | "free_product" | "consolation";

const REWARD_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  coupon: { label: "Mã giảm giá", color: "text-pink-300 border-pink-400/40 bg-pink-500/10", emoji: "🎟️" },
  free_product: { label: "Sản phẩm miễn phí", color: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10", emoji: "📱" },
  jackpot: { label: "Jackpot", color: "text-yellow-300 border-yellow-400/40 bg-yellow-500/10", emoji: "🏆" },
  consolation: { label: "An ủi", color: "text-softgray border-gunmetal/40 bg-charcoal", emoji: "🍀" },
};

function SpinDetailModal({
  row,
  onClose,
}: {
  row: SpinHistoryItem | null;
  onClose: () => void;
}) {
  if (!row) return null;
  const kind = (row.reward_type || row.prize_kind || "consolation") as keyof typeof REWARD_LABEL;
  const meta = REWARD_LABEL[kind] ?? REWARD_LABEL.consolation;
  const isProduct = kind === "free_product" || kind === "jackpot";
  const isCoupon = kind === "coupon" || (!!row.coupon_code && !isProduct);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0d1442] to-[#05070f] p-7 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={`mb-1 inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${meta.color}`}>
          {meta.emoji} {meta.label}
        </p>
        <h2 className="mb-1 mt-4 text-2xl font-extrabold text-warmwhite">{row.prize_label}</h2>
        <p className="mb-5 text-xs text-steelgray">
          Trúng lúc {new Date(row.created_at).toLocaleString("vi-VN")}
        </p>

        {isProduct && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-500/10 p-3">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-graphite">
              {row.product_image_url ? (
                <img src={row.product_image_url} alt={row.product_name || ""} className="h-full w-full object-contain" />
              ) : (
                <span className="text-2xl">📱</span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-emerald-200">Sản phẩm trúng thưởng</p>
              <p className="text-base font-bold text-emerald-100">{row.product_name || `Sản phẩm #${row.product_id}`}</p>
              <p className="mt-1 text-[11px] text-white/60">Đơn hàng đã được ghi nhận tự động, bạn không cần thanh toán.</p>
            </div>
          </div>
        )}

        {isCoupon && row.coupon_code && (
          <div className="mb-5">
            <p className="mb-1 text-[11px] uppercase tracking-wider text-white/60">Mã giảm giá của bạn</p>
            <div className="rounded-xl border border-dashed border-pink-400/60 bg-pink-500/10 px-4 py-3 font-mono text-2xl font-bold tracking-[0.25em] text-pink-200">
              {row.coupon_code}
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              {row.coupon_discount_type === "percent"
                ? `Giảm ${row.coupon_discount_value ?? row.discount_value ?? 0}% cho đơn hàng tiếp theo.`
                : row.coupon_discount_type === "fixed"
                  ? `Giảm ${new Intl.NumberFormat("vi-VN").format(Number(row.coupon_discount_value ?? row.discount_value ?? 0))} VND cho đơn hàng tiếp theo.`
                  : "Mã chỉ dùng được 1 lần — nhập khi thanh toán."}
            </p>
          </div>
        )}

        {!isProduct && !isCoupon && (
          <p className="mb-5 text-sm text-softgray">
            Bạn không nhận được quà cụ thể trong lượt quay này. Quay tiếp để có thêm cơ hội trúng thưởng!
          </p>
        )}

        <div className="flex justify-end gap-2">
          {isCoupon && row.coupon_code && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(row.coupon_code || "")}
              className="rounded-2xl border border-pink-400/50 bg-pink-500/10 px-4 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-500/20"
            >
              Sao chép mã
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-2xl bg-gradient-to-r from-crimson to-rose px-5 py-2 text-sm font-semibold text-white shadow-lg hover:scale-[1.02]"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpinHistory() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<SpinHistoryItem | null>(null);

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["spin-history"],
    queryFn: async () => (await spinApi.history()).data,
    enabled: !!user,
  });

  const totalCoupons = history.filter((h) => h.reward_type === "coupon" || (h.coupon_code && !h.product_id)).length;
  const totalProducts = history.filter((h) => h.reward_type === "free_product" || h.product_id).length;

  if (!user) {
    return (
      <div className="container-padding section-padding text-center">
        <p className="text-softgray">Bạn cần đăng nhập để xem lịch sử quay thưởng.</p>
        <Link className="btn-primary mt-4 inline-block" to="/login">Đăng nhập</Link>
      </div>
    );
  }

  const filtered = history.filter((h) => {
    if (filter === "all") return true;
    return h.reward_type === filter;
  });

  return (
    <div className="container-padding section-padding">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/spin" className="text-xs text-rose hover:text-sakura">← Quay lại Vòng Quay</Link>
            <h1 className="mt-1 text-3xl font-extrabold text-warmwhite">Lịch sử quay thưởng</h1>
            <p className="text-sm text-softgray">
              Xem tất cả giải bạn từng trúng. Mỗi lượt quay tạo một bản ghi vĩnh viễn — mã giảm giá có thể dùng lại bất kỳ lúc nào.
            </p>
          </div>
          <div className="flex gap-3 text-center text-xs">
            <div className="rounded-2xl border border-pink-400/30 bg-pink-500/10 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-pink-200">Mã giảm giá</p>
              <p className="text-xl font-bold text-pink-100">{totalCoupons}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-emerald-200">Sản phẩm miễn phí</p>
              <p className="text-xl font-bold text-emerald-100">{totalProducts}</p>
            </div>
            <div className="rounded-2xl border border-gunmetal/40 bg-charcoal px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-steelgray">Tổng lượt quay</p>
              <p className="text-xl font-bold text-warmwhite">{history.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { id: "all" as const, label: "Tất cả" },
            { id: "coupon" as const, label: "🎟️ Mã giảm giá" },
            { id: "free_product" as const, label: "📱 Sản phẩm miễn phí" },
            { id: "consolation" as const, label: "🍀 Khác" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                filter === opt.id
                  ? "border-rose bg-rose/15 text-warmwhite"
                  : "border-gunmetal/40 bg-charcoal text-softgray hover:text-warmwhite"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {loadingHistory ? (
          <p className="text-sm text-steelgray">Đang tải lịch sử...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-bento border border-gunmetal/40 bg-cardtint/60 p-10 text-center">
            <p className="text-softgray">Bạn chưa có lượt quay nào trong mục này.</p>
            <Link to="/spin" className="btn-primary mt-4 inline-block">Quay ngay</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((h) => {
              const kind = (h.reward_type || h.prize_kind || "consolation") as keyof typeof REWARD_LABEL;
              const meta = REWARD_LABEL[kind] ?? REWARD_LABEL.consolation;
              return (
                <li
                  key={h.id}
                  className="flex flex-wrap items-center gap-3 rounded-bento border border-gunmetal/40 bg-cardtint/60 p-4"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-graphite">
                    {h.product_image_url ? (
                      <img src={h.product_image_url} alt="" className="h-full w-full object-contain" />
                    ) : h.image ? (
                      <img src={h.image} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-2xl">{meta.emoji}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-warmwhite">{h.prize_label}</p>
                    <p className="text-[11px] text-steelgray">
                      <span className={meta.color.split(" ")[0]}>{meta.label}</span>
                      {" · "}
                      {new Date(h.created_at).toLocaleString("vi-VN")}
                    </p>
                    {h.coupon_code && (
                      <p className="mt-1 font-mono text-xs text-pink-200">
                        Mã: <span className="font-bold">{h.coupon_code}</span>
                      </p>
                    )}
                    {h.product_name && (
                      <p className="mt-1 text-xs text-emerald-200">Sản phẩm: {h.product_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(h)}
                    className="rounded-2xl border border-rose/40 bg-rose/10 px-4 py-2 text-xs font-semibold text-rose hover:bg-rose/20"
                  >
                    Xem chi tiết
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <SpinDetailModal row={open} onClose={() => setOpen(null)} />
    </div>
  );
}