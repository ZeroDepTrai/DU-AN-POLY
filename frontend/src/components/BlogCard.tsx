import { Link } from "react-router-dom";
import type { BlogPostListItem } from "../types";
import GlassCard from "./aurora/GlassCard";
import AuroraBadge from "./aurora/AuroraBadge";

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

  const tagList = post.tags
    ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <GlassCard intensity="low" hoverable className="flex h-full flex-col overflow-hidden p-0">
        {post.image_url && (
          <div className={`relative overflow-hidden ${featured ? "aspect-[16/9]" : "aspect-video"}`}>
            <div className="absolute inset-0 bg-aurora-gradient opacity-0 transition-opacity group-hover:opacity-30" />
            <img
              src={post.image_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            {tagList[0] && (
              <div className="absolute left-3 top-3">
                <AuroraBadge tone="rose" glow>{tagList[0]}</AuroraBadge>
              </div>
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col p-5">
          {tagList.length > 1 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {tagList.slice(1).map((t: string) => (
                <AuroraBadge key={t} tone="sakura">{t}</AuroraBadge>
              ))}
            </div>
          )}
          <p className="text-xs font-medium text-steelgray">{formattedDate}</p>
          <h3 className="mt-1 flex-1 text-lg font-bold text-warmwhite group-hover:text-sakura transition-colors line-clamp-3">
            {post.title}
          </h3>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium aurora-text-rainbow transition-colors">
            Đọc thêm
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}