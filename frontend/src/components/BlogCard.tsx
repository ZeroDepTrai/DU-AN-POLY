import { Link } from "react-router-dom";
import type { BlogPostListItem } from "../types";

interface BlogCardProps {
  post: BlogPostListItem;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const formattedDate = new Date(post.created_at).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/30"
    >
      {post.image_url && (
        <div className={`overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-video"}`}>
          <img
            src={post.image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-3 text-xs font-medium text-steelgray">{formattedDate}</p>
        <h3 className="flex-1 text-lg font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-3">
          {post.title}
        </h3>
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-crimson group-hover:text-sakura transition-colors">
          Đọc thêm
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
