import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { blogApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

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
        <h2 className="text-2xl font-bold text-warmwhite">Bài viết không tồn tại</h2>
        <p className="mt-2 text-steelgray">Bài viết này có thể đã bị xóa.</p>
        <Link to="/blog" className="btn-primary mt-6">
          Quay về blog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-steelgray">
        <Link to="/blog" className="hover:text-crimson transition-colors">Blog</Link>
        <span>/</span>
        <span className="text-warmwhite truncate max-w-xs">{post.title}</span>
      </div>

      {/* Article */}
      <article>
        {/* Cover image */}
        {post.image_url && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={post.image_url}
              alt={post.title}
              className="h-72 w-full object-cover md:h-96"
            />
          </div>
        )}

        {/* Meta */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson/10 text-crimson font-bold text-sm">
            {post.author_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-warmwhite">{post.author_name}</p>
            <p className="text-sm text-steelgray">{post.created_at}</p>
          </div>
        </div>

        <h1 className="mb-6 text-3xl font-extrabold text-warmwhite leading-tight md:text-4xl">
          {post.title}
        </h1>

        {/* Rich HTML content from Tiptap */}
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Share / back */}
        <div className="mt-10 flex items-center justify-between border-t border-gunmetal/40 pt-6">
          <Link to="/blog" className="btn-ghost text-sm">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Quay về blog
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-steelgray">Chia sẻ:</span>
            <button className="btn-ghost h-8 w-8 p-0">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.261 5.635zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>
      </article>

      {/* Blog content styles */}
      <style>{`
        .prose h2 { font-size: 1.5rem; font-weight: 700; color: #EEE7E8; margin: 1.5em 0 0.75em; }
        .prose h3 { font-size: 1.2rem; font-weight: 600; color: #EEE7E8; margin: 1.25em 0 0.5em; }
        .prose p { color: #C9C4C6; margin: 1em 0; line-height: 1.75; }
        .prose ul { list-style-type: disc; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose ol { list-style-type: decimal; padding-left: 1.5em; margin: 1em 0; color: #C9C4C6; }
        .prose li { margin: 0.4em 0; }
        .prose blockquote {
          border-left: 4px solid #D94A63;
          padding-left: 1em;
          color: #C9C4C6;
          margin: 1.5em 0;
          font-style: italic;
        }
        .prose code {
          background: #353039;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.875em;
          font-family: monospace;
          color: #F28CA6;
        }
        .prose pre {
          background: #353039;
          padding: 1.25em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose pre code { background: none; padding: 0; color: #C9C4C6; }
        .prose img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5em auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
