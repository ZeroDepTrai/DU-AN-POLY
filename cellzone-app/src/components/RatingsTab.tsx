import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ratingsApi } from "../api/client";
import { Star } from "lucide-react";

export default function RatingsTab() {
  const [filter, setFilter] = useState<number | null>(null);

  const { data: ratings = [], isLoading } = useQuery({
    queryKey: ["ratings"],
    queryFn: ratingsApi.list,
  });

  const filteredRatings = filter ? ratings.filter((r) => r.rating === filter) : ratings;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-600"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#f0f0f5]">Đánh giá sản phẩm</h1>
        <p className="text-sm text-[#8b8b9a] mt-1">Xem và quản lý đánh giá từ khách hàng</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === null ? "bg-indigo-500 text-white" : "glass text-[#8b8b9a]"
          }`}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => setFilter(star)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filter === star ? "bg-indigo-500 text-white" : "glass text-[#8b8b9a]"
            }`}
          >
            {star} <Star className="w-4 h-4 fill-current" />
          </button>
        ))}
      </div>

      {/* Ratings List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="glass-card p-8 text-center text-[#8b8b9a]">Đang tải...</div>
        ) : filteredRatings.length === 0 ? (
          <div className="glass-card p-8 text-center text-[#8b8b9a]">Chưa có đánh giá nào.</div>
        ) : (
          filteredRatings.map((rating) => (
            <div key={rating.id} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-[#f0f0f5]">{rating.customer_name}</p>
                  <p className="text-xs text-[#5a5a6a]">{rating.product_name}</p>
                </div>
                {renderStars(rating.rating)}
              </div>
              {rating.comment && (
                <p className="text-sm text-[#8b8b9a] mb-3">"{rating.comment}"</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5a5a6a]">
                  {new Date(rating.created_at).toLocaleDateString("vi-VN")}
                </span>
                <span className="text-xs text-[#5a5a6a]">
                  Đơn hàng #{rating.order_id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
