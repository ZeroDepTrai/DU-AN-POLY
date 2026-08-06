import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { blogApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";
import BlogCard from "../components/BlogCard";
import GlassCard from "../components/aurora/GlassCard";
import GlowButton from "../components/aurora/GlowButton";
import OptimizedImage from "../components/OptimizedImage";
import AuroraBadge from "../components/aurora/AuroraBadge";

interface Comment {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
  avatar?: string;
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data } = await blogApi.get(slug!);
      return data;
    },
    enabled: Boolean(slug),
  });

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ["blog-related", slug],
    queryFn: async () => {
      const { data } = await blogApi.list();
      return data.filter((p) => p.slug !== slug).slice(0, 3);
    },
    enabled: Boolean(slug),
  });

  const formattedDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const estimateReadTime = (content: string) => {
    const words = content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
    return `${Math.ceil(words / 200)} phút đọc`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post?.title || "");
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      zalo: `https://zalo.me/share?url=${url}`,
    };
    if (urls[platform]) {
      window.open(urls[platform], "_blank", "noopener,noreferrer");
    }
  };

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

  const postTags = post.tags
    ? post.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  const mockComments: Comment[] = [
    {
      id: 1,
      author_name: "Minh Anh",
      content: "Bài viết rất hữu ích! Cảm ơn CellZone đã chia sẻ. Đã chia sẻ cho bạn bè rồi.",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
    {
      id: 2,
      author_name: "Hoàng Nam",
      content: "Mình đang cần thông tin này. Mong team ra thêm nhiều bài về smartphone hơn.",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 3,
      author_name: "Thu Hà",
      content: "Trình bày đẹp, dễ đọc. Bookmark lại ngay!",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  return (
    <div className="min-h-screen bg-darkbase">
      {/* Article Hero Header */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-darkbase via-transparent to-darkbase" />
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/3 h-80 w-80 rounded-full bg-sakura/10 blur-[128px]" />
          <div className="absolute right-1/4 bottom-1/3 h-64 w-64 rounded-full bg-violet/10 blur-[96px]" />
        </div>
        {post.image_url && (
          <div className="relative mx-auto max-h-[520px] overflow-hidden">
            <OptimizedImage
              src={post.image_url}
              alt={post.title}
              priority
              sizes="100vw"
              className="w-full object-cover"
              style={{ maxHeight: "520px" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-darkbase via-darkbase/60 to-darkbase/20" />
          </div>
        )}
        <div className="container-padding relative pb-10 pt-8">
          <div className="mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <div className="mb-6 flex items-center gap-2 text-sm text-steelgray">
              <Link to="/" className="hover:text-sakura transition-colors">Trang chủ</Link>
              <span>/</span>
              <Link to="/blog" className="hover:text-sakura transition-colors">Blog</Link>
              <span>/</span>
              <span className="truncate max-w-xs text-warmwhite">{post.title}</span>
            </div>

            {/* Category Tags */}
            <div className="mb-4 flex flex-wrap gap-2">
              {postTags.map((t: string) => (
                <AuroraBadge key={t} tone="rose" glow className="text-xs">{t}</AuroraBadge>
              ))}
            </div>

            {/* Article Title */}
            <h1 className="mb-6 text-3xl font-extrabold leading-tight text-warmwhite md:text-4xl xl:text-5xl">
              {post.title}
            </h1>

            {/* Author + Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aurora-gradient text-lg font-bold text-white shadow-glow-violet">
                  {post.author_name?.charAt(0).toUpperCase() || "A"}
                </div>
                <div>
                  <p className="font-medium text-warmwhite">{post.author_name}</p>
                  <div className="flex items-center gap-3 text-xs text-steelgray">
                    <span>{formattedDate(post.created_at)}</span>
                    <span className="h-1 w-1 rounded-full bg-steelgray" />
                    <span>{estimateReadTime(post.content || "")}</span>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-steelgray hidden sm:inline">Chia sẻ:</span>
                <button
                  onClick={() => handleShare("facebook")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-steelgray transition-all hover:border-blue-500/40 hover:text-blue-400 focus-rose"
                  title="Chia sẻ Facebook"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare("twitter")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-steelgray transition-all hover:border-sky-500/40 hover:text-sky-400 focus-rose"
                  title="Chia sẻ Twitter/X"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleShare("zalo")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-steelgray transition-all hover:border-blue-400/40 hover:text-blue-300 focus-rose"
                  title="Chia sẻ Zalo"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-6h2v2h-2zm1-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                  </svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className={[
                    "flex h-9 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-all focus-rose",
                    copied
                      ? "border-sakura/40 bg-sakura/10 text-sakura"
                      : "border-white/[0.06] bg-white/[0.04] text-steelgray hover:border-white/30 hover:text-warmwhite",
                  ].join(" ")}
                  title="Sao chép liên kết"
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Đã copy!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      Copy link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <div className="container-padding pb-16">
        <div className="mx-auto max-w-3xl">
          <GlassCard intensity="low" className="p-6 md:p-10">
            <div
              className="prose-aurora-v2 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </GlassCard>

          {/* Article Footer Nav */}
          <div className="mt-10 flex items-center justify-between border-t border-white/[0.06] pt-8">
            <GlowButton variant="ghost" onClick={() => window.history.back()} className="gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay về blog
            </GlowButton>
            <div className="flex items-center gap-2 text-sm text-steelgray">
              <span>Đăng bởi</span>
              <span className="font-medium text-warmwhite">{post.author_name}</span>
              <span>· CellZone</span>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.06]" />
                <h2 className="text-lg font-bold text-warmwhite">Bài viết liên quan</h2>
                <span className="h-px flex-1 bg-white/[0.06]" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((related) => (
                  <BlogCard key={related.id} post={related} />
                ))}
              </div>
            </section>
          )}

          {/* Comments Section */}
          <section className="mt-16">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/[0.06]" />
              <h2 className="flex items-center gap-2 text-lg font-bold text-warmwhite">
                <svg className="h-5 w-5 text-sakura" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Bình luận ({mockComments.length})
              </h2>
              <span className="h-px flex-1 bg-white/[0.06]" />
            </div>

            <GlassCard intensity="med" className="p-6 md:p-8">
              {/* Comment Form */}
              <div className="mb-8">
                <h3 className="mb-3 text-sm font-semibold text-warmwhite">Để lại bình luận</h3>
                <textarea
                  placeholder="Chia sẻ suy nghĩ của bạn về bài viết..."
                  rows={4}
                  className="mb-3 w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-warmwhite placeholder:text-steelgray transition-all focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-sakura/30 resize-none"
                />
                <div className="flex justify-end">
                  <button className="rounded-xl bg-rose-gradient px-6 py-2.5 text-sm font-semibold text-white shadow-glow-violet transition-all hover:opacity-90 focus-rose">
                    Gửi bình luận
                  </button>
                </div>
              </div>

              {/* Comment List */}
              <div className="space-y-6">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-aurora-gradient text-sm font-bold text-white shadow-glow-violet">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="font-medium text-warmwhite">{comment.author_name}</span>
                        <span className="text-xs text-steelgray">{formattedDate(comment.created_at)}</span>
                      </div>
                      <GlassCard intensity="low" className="p-4">
                        <p className="text-sm leading-relaxed text-steelgray">{comment.content}</p>
                      </GlassCard>
                      <div className="mt-2 flex gap-3">
                        <button className="flex items-center gap-1 text-xs text-steelgray transition-colors hover:text-sakura focus-rose">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                          Thích
                        </button>
                        <button className="flex items-center gap-1 text-xs text-steelgray transition-colors hover:text-sakura focus-rose">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          Trả lời
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </section>
        </div>
      </div>

      <style>{`
        .prose-aurora-v2 h2 { font-size: 1.5rem; font-weight: 700; color: #EEE7E8; margin: 2em 0 0.75em; }
        .prose-aurora-v2 h3 { font-size: 1.2rem; font-weight: 600; color: #EEE7E8; margin: 1.5em 0 0.5em; }
        .prose-aurora-v2 h4 { font-size: 1rem; font-weight: 600; color: #EEE7E8; margin: 1.25em 0 0.5em; }
        .prose-aurora-v2 p:first-of-type::first-letter {
          float: left;
          font-size: 3.5rem;
          line-height: 1;
          font-weight: 800;
          margin-right: 0.5rem;
          color: #F28CA6;
          text-shadow: 0 0 20px rgba(242,140,166,0.4);
        }
        .prose-aurora-v2 p { color: #C9C4C6; margin: 1.25em 0; line-height: 1.85; font-size: 1rem; }
        .prose-aurora-v2 ul { list-style-type: disc; padding-left: 1.5em; margin: 1.25em 0; color: #C9C4C6; }
        .prose-aurora-v2 ol { list-style-type: decimal; padding-left: 1.5em; margin: 1.25em 0; color: #C9C4C6; }
        .prose-aurora-v2 li { margin: 0.5em 0; }
        .prose-aurora-v2 blockquote {
          border-left: 4px solid #F28CA6;
          padding: 1em 1.5em;
          color: #C9C4C6;
          margin: 2em 0;
          font-style: italic;
          font-size: 1.05rem;
          background: rgba(242,140,166,0.06);
          border-radius: 0 16px 16px 0;
          position: relative;
        }
        .prose-aurora-v2 blockquote::before {
          content: '"';
          position: absolute;
          left: 0.5em;
          top: -0.2em;
          font-size: 3rem;
          color: rgba(242,140,166,0.3);
          font-family: serif;
          line-height: 1;
        }
        .prose-aurora-v2 code {
          background: rgba(217,74,99,0.12);
          padding: 0.15em 0.45em;
          border-radius: 6px;
          font-size: 0.875em;
          font-family: monospace;
          color: #F28CA6;
          border: 1px solid rgba(242,140,166,0.15);
        }
        .prose-aurora-v2 pre {
          background: rgba(10,8,12,0.7);
          border: 1px solid rgba(242,140,166,0.15);
          padding: 1.5em;
          border-radius: 16px;
          overflow-x: auto;
          margin: 2em 0;
          position: relative;
        }
        .prose-aurora-v2 pre::before {
          content: attr(data-lang);
          position: absolute;
          top: 0.75em;
          right: 1em;
          font-size: 0.7rem;
          color: rgba(242,140,166,0.4);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .prose-aurora-v2 pre code { background: none; padding: 0; color: #C9C4C6; font-size: 0.9em; border: none; }
        .prose-aurora-v2 img {
          max-width: 100%;
          border-radius: 16px;
          margin: 2em auto;
          display: block;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .prose-aurora-v2 a {
          color: #F28CA6;
          text-decoration: none;
          border-bottom: 1px dotted rgba(242,140,166,0.4);
          transition: color 0.2s, border-color 0.2s;
        }
        .prose-aurora-v2 a:hover { color: #E36A86; border-color: #E36A86; }
        .prose-aurora-v2 hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.06);
          margin: 2.5em 0;
        }
        .prose-aurora-v2 table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 0.9em;
        }
        .prose-aurora-v2 th {
          background: rgba(242,140,166,0.1);
          padding: 0.75em 1em;
          text-align: left;
          color: #F28CA6;
          font-weight: 600;
          border-bottom: 2px solid rgba(242,140,166,0.2);
        }
        .prose-aurora-v2 td {
          padding: 0.65em 1em;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #C9C4C6;
        }
        .prose-aurora-v2 strong { color: #EEE7E8; font-weight: 600; }
        .prose-aurora-v2 em { color: #B0A8AB; }
      `}</style>
    </div>
  );
}
