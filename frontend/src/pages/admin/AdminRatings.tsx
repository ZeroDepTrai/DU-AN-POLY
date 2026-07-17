import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, ratingsApi } from "../../api/client";
import GlassCard from "../../components/aurora/GlassCard";
import AuroraBadge from "../../components/aurora/AuroraBadge";
import StarRating from "../../components/aurora/StarRating";

const LIMIT = 20;

export default function AdminRatings() {
  const [page, setPage] = useState(1);
  const [filterStars, setFilterStars] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Pull all admin products so we can compute the aggregate stats card and
  // drive the per-product drill-down list. This endpoint already hydrates
  // avg_rating / rating_count / like_count on the server.
  const productsQuery = useQuery({
    queryKey: ["admin-products-for-ratings"],
    queryFn: async () => {
      const { data } = await adminApi.listProducts();
      return data;
    },
  });

  // When a product is picked, fetch its full rating list from the
  // existing /api/products/{id}/ratings/list endpoint.
  const ratingsQuery = useQuery({
    queryKey: ["admin-ratings-list", selectedProductId, page],
    queryFn: async () => {
      if (selectedProductId === null) {
        return { items: [], total: 0, page: 1, limit: LIMIT };
      }
      const { data } = await ratingsApi.list(selectedProductId, { page, limit: LIMIT });
      return data;
    },
    enabled: selectedProductId !== null,
  });

  const stats = useMemo(() => {
    const products = productsQuery.data ?? [];
    const ratedProducts = products.filter((p) => (p.rating_count ?? 0) > 0);
    const totalRatings = ratedProducts.reduce((s, p) => s + (p.rating_count ?? 0), 0);
    const avg =
      ratedProducts.length === 0
        ? 0
        : ratedProducts.reduce((s, p) => s + (p.avg_rating ?? 0), 0) / ratedProducts.length;
    const distribution = [0, 0, 0, 0, 0];
    ratedProducts.forEach((p) => {
      const idx = Math.min(4, Math.max(0, Math.round((p.avg_rating ?? 0) - 1)));
      distribution[idx] += p.rating_count ?? 0;
    });
    return { totalRatings, avg, distribution, productCount: ratedProducts.length };
  }, [productsQuery.data]);

  const filteredProducts = useMemo(() => {
    const products = productsQuery.data ?? [];
    return products
      .filter((p) =>
        filterStars === 0 ? true : Math.round(p.avg_rating ?? 0) === filterStars
      )
      .filter((p) =>
        search ? p.name.toLowerCase().includes(search.toLowerCase()) : true
      )
      .sort((a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0));
  }, [productsQuery.data, filterStars, search]);

  const selectedProduct = useMemo(
    () => (productsQuery.data ?? []).find((p) => p.id === selectedProductId) ?? null,
    [productsQuery.data, selectedProductId]
  );

  const totalPages = ratingsQuery.data
    ? Math.max(1, Math.ceil(ratingsQuery.data.total / LIMIT))
    : 1;

  return (
    <div>
      <div className="mb-6">
        <AuroraBadge tone="amber" glow className="mb-2">
          Đánh giá & Cảm xúc
        </AuroraBadge>
        <h1 className="aurora-text-gradient text-2xl font-extrabold md:text-3xl">
          Đánh giá sản phẩm
        </h1>
        <p className="mt-1 text-sm text-softgray">
          Theo dõi điểm trung bình, phân phối đánh giá và lượt thích theo từng sản phẩm.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <GlassCard intensity="med" className="p-5">
          <p className="text-xs uppercase tracking-wide text-softgray">Tổng quan</p>
          <div className="mt-3 flex items-center gap-4">
            <p className="aurora-text-rainbow text-5xl font-extrabold">
              {stats.avg.toFixed(2)}
            </p>
            <div>
              <StarRating value={stats.avg} readonly size="lg" />
              <p className="mt-1 text-sm text-softgray">
                {stats.totalRatings} lượt đánh giá
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-softgray">
            Dựa trên {stats.productCount} sản phẩm có đánh giá.
          </p>
        </GlassCard>

        <GlassCard intensity="med" className="p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-softgray">
            Phân phối đánh giá
          </p>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star - 1] ?? 0;
            const pct = stats.totalRatings === 0 ? 0 : (count / stats.totalRatings) * 100;
            return (
              <button
                key={star}
                type="button"
                onClick={() =>
                  setFilterStars(filterStars === star ? 0 : star)
                }
                className={`mb-2 flex w-full items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-white/5 ${
                  filterStars === star ? "bg-white/5" : ""
                }`}
              >
                <span className="w-8 text-sm font-medium text-warmwhite">{star}★</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-rose-400"
                    style={{ width: `${pct}%`, transition: "width 240ms ease" }}
                  />
                </div>
                <span className="w-10 text-right text-xs text-softgray">{count}</span>
              </button>
            );
          })}
          {filterStars > 0 && (
            <button
              type="button"
              onClick={() => setFilterStars(0)}
              className="mt-2 text-xs text-sakura underline-offset-2 hover:underline"
            >
              Xoá bộ lọc {filterStars}★
            </button>
          )}
        </GlassCard>
      </div>

      <GlassCard intensity="med" className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-warmwhite">Đánh giá theo sản phẩm</h2>
            <p className="text-xs text-softgray">{filteredProducts.length} sản phẩm</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="aurora-input w-full sm:w-72"
          />
        </div>
        {productsQuery.isLoading ? (
          <div className="p-6 text-center text-softgray">Đang tải...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-softgray">
            Chưa có đánh giá phù hợp.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.04] text-left text-softgray">
              <tr>
                <th className="px-5 py-3">Sản phẩm</th>
                <th className="px-5 py-3">Đánh giá</th>
                <th className="px-5 py-3">Lượt thích</th>
                <th className="px-5 py-3">Trung bình</th>
                <th className="px-5 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-white/5 transition-colors hover:bg-white/[0.04]"
                >
                  <td className="px-5 py-3 font-medium text-warmwhite">{p.name}</td>
                  <td className="px-5 py-3 text-softgray">{p.rating_count ?? 0} lượt</td>
                  <td className="px-5 py-3 text-lightpink">♥ {p.like_count ?? 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StarRating value={p.avg_rating ?? 0} readonly size="sm" />
                      <span className="text-xs text-softgray">
                        {(p.avg_rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setPage(1);
                      }}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-warmwhite transition-colors hover:bg-white/5"
                    >
                      Xem lượt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {selectedProduct && (
        <div className="mt-6">
          <GlassCard intensity="med" className="overflow-hidden p-0">
            <div className="flex flex-col gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-warmwhite">
                  Lượt đánh giá — {selectedProduct.name}
                </h2>
                <p className="text-xs text-softgray">
                  {ratingsQuery.data?.total ?? 0} lượt · trung bình{" "}
                  {(selectedProduct.avg_rating ?? 0).toFixed(1)}★
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="text-xs text-softgray underline-offset-2 hover:text-warmwhite hover:underline"
              >
                Đóng
              </button>
            </div>

            {ratingsQuery.isLoading ? (
              <div className="p-6 text-center text-softgray">Đang tải...</div>
            ) : (ratingsQuery.data?.items ?? []).length === 0 ? (
              <div className="p-8 text-center text-softgray">
                Sản phẩm này chưa có lượt đánh giá nào.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-left text-softgray">
                  <tr>
                    <th className="px-5 py-3">Người dùng</th>
                    <th className="px-5 py-3">Sao</th>
                    <th className="px-5 py-3">Nhận xét</th>
                    <th className="px-5 py-3">Ngày</th>
                  </tr>
                </thead>
                <tbody>
                  {(ratingsQuery.data?.items ?? []).map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-white/5 transition-colors hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-3 font-medium text-warmwhite">
                        {r.user_name || `User #${r.user_id}`}
                      </td>
                      <td className="px-5 py-3">
                        <StarRating value={r.stars} readonly size="sm" />
                      </td>
                      <td className="px-5 py-3 text-softgray">
                        {r.review ? (
                          <span className="line-clamp-2">{r.review}</span>
                        ) : (
                          <span className="italic text-steelgray">
                            (Không có nhận xét)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-softgray">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString("vi-VN")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {ratingsQuery.data && ratingsQuery.data.total > LIMIT && (
              <div className="flex items-center justify-center gap-2 border-t border-white/10 px-5 py-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-warmwhite transition-colors hover:bg-white/5 disabled:opacity-40"
                >
                  Trước
                </button>
                <span className="text-sm text-softgray">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-warmwhite transition-colors hover:bg-white/5 disabled:opacity-40"
                >
                  Sau
                </button>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}