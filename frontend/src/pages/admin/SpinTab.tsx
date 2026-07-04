import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminApi,
  adminSpinApi,
} from "../../api/client";
import type { WheelPrize } from "../../api/client";
import LoadingSpinner from "../../components/LoadingSpinner";

function SpinTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    title: string;
    background_url: string;
    spend_per_spin_vnd: number;
    prizes: WheelPrize[];
  }>({
    title: "",
    background_url: "",
    spend_per_spin_vnd: 3_000_000,
    prizes: [],
  });
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  const detectRewardType = (p: WheelPrize): WheelPrize["reward_type"] => {
    if (p.reward_type) return p.reward_type;
    if (p.product_id) return "free_product";
    if (p.coupon_id || p.coupon_discount_type || p.coupon_discount_value != null) return "coupon";
    if (p.jackpot) return "jackpot";
    return "consolation";
  };

  const { data: cfg, isLoading } = useQuery({
    queryKey: ["admin-wheel"],
    queryFn: async () => {
      const { data } = await adminSpinApi.get();
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await adminApi.listProducts()).data,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let backgroundUrl = form.background_url;
      if (backgroundFile) {
        const r = await adminApi.uploadMedia(backgroundFile);
        backgroundUrl = r.data.url;
      }
      const payloadPrizes = form.prizes.map((p) => {
        const base: WheelPrize = {
          name: p.name || "Quà",
          image: p.image || "",
          weight: Number(p.weight ?? 0),
          jackpot: !!p.jackpot,
          icon: p.icon || "",
        };
        const r = detectRewardType(p);
        base.reward_type = r;
        if (r === "free_product") {
          base.product_id = p.product_id ?? null;
        } else if (r === "coupon") {
          if (p.coupon_id) {
            base.coupon_id = p.coupon_id;
          } else {
            base.coupon_discount_type = p.coupon_discount_type ?? "percent";
            base.coupon_discount_value = Number(p.coupon_discount_value ?? 0);
          }
        }
        return base;
      });
      return adminSpinApi.update({
        title: form.title,
        background_url: backgroundUrl,
        spend_per_spin_vnd: form.spend_per_spin_vnd,
        prizes: payloadPrizes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-wheel"] });
      queryClient.invalidateQueries({ queryKey: ["spin-config"] });
      setEditing(false);
    },
    onError: (e: any) =>
      setError(e?.response?.data?.detail || "Lưu thất bại, vui lòng thử lại."),
  });

  useEffect(() => {
    if (!cfg) return;
    setForm({
      title: cfg.title || "",
      background_url: cfg.background_url || "",
      spend_per_spin_vnd: cfg.spend_per_spin_vnd,
      prizes: cfg.prizes.map((p) => ({
        name: p.name,
        image: p.image || "",
        weight: Number(p.weight ?? 1),
        jackpot: !!p.jackpot,
        icon: p.icon || "",
        reward_type: detectRewardType(p),
        coupon_id: p.coupon_id ?? null,
        product_id: p.product_id ?? null,
        coupon_discount_type: p.coupon_discount_type ?? null,
        coupon_discount_value: p.coupon_discount_value ?? null,
      })),
    });
  }, [cfg]);

  const updatePrize = (idx: number, patch: Partial<WheelPrize>) => {
    setForm((prev) => {
      const next = [...prev.prizes];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, prizes: next };
    });
  };

  const setRewardType = (idx: number, type: NonNullable<WheelPrize["reward_type"]>) => {
    setForm((prev) => {
      const next = [...prev.prizes];
      const cur = { ...next[idx], reward_type: type };
      if (type !== "free_product") cur.product_id = null;
      if (type !== "coupon") {
        cur.coupon_id = null;
        cur.coupon_discount_type = null;
        cur.coupon_discount_value = null;
      }
      if (type === "free_product") cur.jackpot = false;
      next[idx] = cur;
      return { ...prev, prizes: next };
    });
  };

  const onPickImage = (idx: number) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await adminApi.uploadMedia(file);
      updatePrize(idx, { image: r.data.url });
    } catch {
      setError("Upload ảnh thất bại.");
    }
  };

  const addPrize = () => {
    setForm((prev) => ({
      ...prev,
      prizes: [
        ...prev.prizes,
        { name: "Phần quà mới", image: "", weight: 1, jackpot: false, icon: "🎁", reward_type: "consolation" },
      ],
    }));
  };

  const removePrize = (idx: number) => {
    setForm((prev) => ({ ...prev, prizes: prev.prizes.filter((_, i) => i !== idx) }));
  };

  if (isLoading) return <LoadingSpinner label="Đang tải cấu hình vòng quay..." />;

  const totalWeight = form.prizes.reduce((s, p) => s + Number(p.weight || 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-warmwhite">Vòng Quay May Mắn</h1>
          <p className="text-sm text-steelgray">
            Cấu hình phần thưởng, hình ảnh, sản phẩm tặng và mã giảm giá mỗi lượt quay.
          </p>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="btn-primary text-sm py-2 px-4">
            Chỉnh sửa
          </button>
        )}
      </div>

      <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-200">
        User nhận <strong>1 lượt quay</strong> cho mỗi{" "}
        <strong>{new Intl.NumberFormat("vi-VN").format(form.spend_per_spin_vnd)} VND</strong> đã mua (đơn hàng đã giao).
        Khi trúng <strong>sản phẩm miễn phí</strong>, hệ thống tự tạo đơn hàng unit_price=0 cho user.
        Khi trúng <strong>mã giảm giá</strong>, hệ thống tự mint một coupon mới (usage_limit=1) — không dùng mã có sẵn.
      </p>

      <fieldset disabled={!editing} className={editing ? "" : "pointer-events-none opacity-90"}>
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-5">
            <label className="mb-1.5 block text-xs text-steelgray">Tiêu đề</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input-field mb-3"
            />
            <label className="mb-1.5 block text-xs text-steelgray">Ngưỡng chi tiêu / lượt quay (VND)</label>
            <input
              type="number"
              min={0}
              step={100000}
              value={form.spend_per_spin_vnd}
              onChange={(e) => setForm({ ...form, spend_per_spin_vnd: Number(e.target.value) })}
              className="input-field mb-3"
            />
            <label className="mb-1.5 block text-xs text-steelgray">Ảnh nền URL (tuỳ chọn)</label>
            <input
              value={form.background_url}
              onChange={(e) => setForm({ ...form, background_url: e.target.value })}
              placeholder="/uploads/spin-bg.jpg"
              className="input-field mb-3 font-mono text-xs"
            />
            <label className="mb-1.5 block text-xs text-steelgray">Tải ảnh nền mới (tuỳ chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBackgroundFile(e.target.files?.[0] ?? null)}
              className="text-sm text-steelgray"
            />
            {form.background_url && (
              <img src={form.background_url} alt="bg" className="mt-3 h-24 w-full rounded-lg object-cover" />
            )}
          </div>

          <div className="rounded-2xl border border-gunmetal/60 bg-graphite p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-warmwhite">Phần thưởng ({form.prizes.length})</h2>
              {editing && (
                <button onClick={addPrize} className="btn-secondary text-xs py-1.5 px-3">
                  + Thêm phần thưởng
                </button>
              )}
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {form.prizes.map((p, idx) => {
                const rtype = detectRewardType(p);
                const pickedProduct = p.product_id
                  ? products.find((prod) => prod.id === p.product_id)
                  : null;
                return (
                  <div key={idx} className="rounded-xl border border-gunmetal/40 bg-charcoal p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-graphite">
                        {p.image ? (
                          <img src={p.image} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <input
                        value={p.name}
                        onChange={(e) => updatePrize(idx, { name: e.target.value })}
                        placeholder="Tên phần thưởng"
                        className="input-field flex-1"
                      />
                      <label className="cursor-pointer rounded-lg bg-gunmetal px-2 py-1.5 text-xs text-warmwhite hover:bg-gunmetal/80">
                        📷
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onPickImage(idx)}
                        />
                      </label>
                    </div>

                    <div className="mb-2 flex flex-wrap gap-1.5 text-xs">
                      {[
                        { v: "consolation", label: "🎁 Khác" },
                        { v: "coupon", label: "🎟️ Mã giảm giá" },
                        { v: "free_product", label: "📱 Sản phẩm miễn phí" },
                        { v: "jackpot", label: "🔥 Jackpot" },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => setRewardType(idx, opt.v as any)}
                          className={`rounded-full px-3 py-1 transition-all ${
                            rtype === opt.v
                              ? "bg-crimson text-white"
                              : "border border-gunmetal/60 bg-graphite text-steelgray hover:text-warmwhite"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {rtype === "free_product" && (
                      <div className="mb-2 rounded-lg bg-graphite p-2">
                        <label className="mb-1 block text-[11px] uppercase tracking-wider text-steelgray">
                          Sản phẩm tặng cho user khi trúng
                        </label>
                        <select
                          value={p.product_id ?? ""}
                          onChange={(e) =>
                            updatePrize(idx, {
                              product_id: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="input-field h-8 text-xs"
                        >
                          <option value="">— Chọn sản phẩm —</option>
                          {products.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              #{prod.id} — {prod.name}
                            </option>
                          ))}
                        </select>
                        {pickedProduct && (
                          <p className="mt-2 rounded bg-charcoal p-2 text-[11px] text-emerald">
                            User sẽ nhận <strong>{pickedProduct.name}</strong> miễn phí khi trúng giải này.
                          </p>
                        )}
                      </div>
                    )}

                    {rtype === "coupon" && (
                      <div className="mb-2 space-y-2 rounded-lg bg-graphite p-2">
                        <label className="mb-1 block text-[11px] uppercase tracking-wider text-steelgray">
                          Loại giảm giá & giá trị
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={p.coupon_discount_type ?? "percent"}
                            onChange={(e) =>
                              updatePrize(idx, { coupon_discount_type: e.target.value as any })
                            }
                            className="input-field h-8 text-xs"
                          >
                            <option value="percent">% phần trăm</option>
                            <option value="fixed">VND cố định</option>
                          </select>
                          <input
                            type="number"
                            step="any"
                            placeholder="Giá trị (vd: 5)"
                            value={p.coupon_discount_value ?? ""}
                            onChange={(e) =>
                              updatePrize(idx, {
                                coupon_discount_value:
                                  e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                            className="input-field h-8 text-xs"
                          />
                        </div>
                        <p className="rounded bg-charcoal p-2 text-[11px] text-emerald">
                          Mỗi lượt trúng sẽ tự tạo một mã <strong>SPXXXXXX</strong> dùng 1 lần (không dùng mã có sẵn).
                        </p>
                      </div>
                    )}

                    {rtype === "jackpot" && (
                      <p className="mb-2 rounded-lg bg-graphite p-2 text-[11px] text-yellow-300">
                        🔥 Jackpot hiển thị nổi bật trên vòng quay. Có thể đổi sang "Sản phẩm miễn phí" ở trên để gắn vào 1 sản phẩm cụ thể.
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-xs">
                      <label className="flex-1">
                        Trọng số (odds)
                        <input
                          type="number"
                          step="0.1"
                          min={0}
                          value={p.weight}
                          onChange={(e) => updatePrize(idx, { weight: Number(e.target.value) })}
                          className="input-field mt-1 h-8 text-xs"
                        />
                      </label>
                      <label className="flex items-center gap-1 pt-4">
                        <input
                          type="checkbox"
                          className="accent-rose"
                          checked={p.jackpot || false}
                          onChange={(e) => updatePrize(idx, { jackpot: e.target.checked })}
                        />
                        Jackpot
                      </label>
                      {editing && (
                        <button
                          onClick={() => removePrize(idx)}
                          className="rounded-lg p-1.5 text-deeprose hover:bg-deeprose/10"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {totalWeight > 0 && (
                      <p className="mt-2 text-[10px] text-steelgray">
                        Xác suất: {((Number(p.weight) / totalWeight) * 100).toFixed(2)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-rose">{error}</p>}
        {editing && (
          <div className="flex gap-3">
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="btn-primary"
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu cấu hình vòng quay"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              className="btn-secondary"
            >
              Huỷ
            </button>
            {saveMutation.isSuccess && (
              <span className="self-center text-sm text-emerald">✓ Đã lưu thành công</span>
            )}
          </div>
        )}
      </fieldset>
    </div>
  );
}
export default SpinTab;
