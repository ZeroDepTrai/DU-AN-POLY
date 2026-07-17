import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { blogApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import AuroraBadge from "../components/aurora/AuroraBadge";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await blogApi.get(slug!);
      return data;
    },
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải bài viết..." />;
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="mb-2 text-2xl font-bold text-warmwhite">Bài viết không tồn tại</h2>
        <p className="mt-2 text-steelgray">Bài viết này có thể đã bị xóa.</p>
        <Link to="/blog" className="btn-primary mt-6">Quay về blog</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <Link to="/blog" className="hover:text-aurora-cyan transition-colors">Blog</Link>
        <span>/</span>
        <span className="truncate max-w-xs text-warmwhite">{post.title}</span>
      </div>

      <article>
        {post.image_url && (
          <div className="mb-8 overflow-hidden rounded-aurora">
            <img
              src={post.image_url}
              alt={post.title}
              className="h-72 w-full object-cover md:h-96"
            />
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-gradient text-lg font-bold text-white shadow-glow-violet">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-warmwhite">{post.author_name}</p>
            <p className="text-sm text-steelgray">{post.created_at}</p>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-extrabold leading-tight aurora-text-gradient md:text-4xl">
          {post.title}
        </h1>

        <GlassCard intensity="low" className="p-6 md:p-8">
          <div
            className="prose-aurora max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </GlassCard>

        <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-6">
          <GlowButton variant="ghost" onClick={() => window.history.back()}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay về blog
          </GlowButton>
          <div className="flex items-center gap-2">
            <span className="text-sm text-steelgray">Chia sẻ:</span>
            <AuroraBadge tone="violet" glow>CellZone</AuroraBadge>
          </div>
        </div>
      </article>

      <style>{`
        .prose-aurora h2 { font-size: 1.5rem; font-weight: 700; color: #F4EFEC; margin: 1.5em 0 0.75em; }
        .prose-aurora h3 { font-size: 1.2rem; font-weight: 600; color: #F4EFEC; margin: 1.25em 0 0.5em; }
        .prose-aurora p { color: #C9C4C6; margin: 1em 0; line-height: 1.75; }
        .prose-aurora ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose-aurora ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose-aurora li { margin: 0.4em 0; }
        .prose-aurora blockquote {
          border-left: 4px solid #22D3EE;
          padding-left: 1em;
          color: #C9C4C6;
          margin: 1.5em 0;
          font-style: italic;
          background: rgba(34,211,238,0.05);
          padding: 1em 1.25em;
          border-radius: 0 12px 12px 0;
        }
        .prose-aurora code {
          background: rgba(91,108,255,0.15);
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: monospace;
          color: #9AA6FF;
        }
        .prose-aurora pre {
          background: rgba(11,16,32,0.6);
          border: 1px solid rgba(91,108,255,0.2);
          padding: 1.25em;
          border-radius: 12px;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose-aurora pre code { background: none; padding: 0; color: #C9C4C6; }
        .prose-aurora img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5em auto;
          display: block;
        }
        .prose-aurora a {
          color: #22D3EE;
          text-decoration: none;
          border-bottom: 1px dotted #22D3EE66;
        }
        .prose-aurora a:hover { color: #34D399; }
      `}</style>
    </div>
  );
}