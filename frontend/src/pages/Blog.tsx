import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { blogApi } from "../api/client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Blog() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data } = await blogApi.list();
      return data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner label="Đang tải blog..." />;
  }

  if (posts.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gunmetal/40">
            <svg className="h-10 w-10 text-steelgray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-warmwhite">Chưa có bài viết nào</h2>
        <p className="mt-2 mb-8 text-steelgray"> Quay lại sau để đọc những bài viết công nghệ thú vị nhất!</p>
        <Link to="/" className="btn-primary">
          Quay về trang chủ
        </Link>
      </div>
    );
  }

  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 border-b border-gunmetal/40 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-crimson" />
          <span className="text-xs font-medium uppercase tracking-widest text-crimson">Blog</span>
        </div>
        <h1 className="text-3xl font-extrabold text-warmwhite">Tin công nghệ & Reviews</h1>
        <p className="mt-2 text-base text-steelgray">Những bài viết mới nhất về điện thoại, công nghệ và xu hướng</p>
      </div>

      <Link
        to={`/blog/${featured.slug}`}
        className="group mb-8 grid overflow-hidden rounded-2xl border border-gunmetal/60 bg-graphite md:grid-cols-2 transition-all hover:border-rose/40"
      >
        {featured.image_url && (
          <div className="aspect-video overflow-hidden md:aspect-auto">
            <img
              src={featured.image_url}
              alt={featured.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-col justify-between p-6">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-rose/20 bg-rose/10 px-3 py-1 text-xs font-medium text-sakura">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson" />
              Bài viết nổi bật
            </div>
            <h2 className="text-2xl font-bold text-warmwhite leading-tight group-hover:text-sakura transition-colors">
              {featured.title}
            </h2>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm text-steelgray">{featured.created_at}</span>
            <span className="flex items-center gap-1 text-sm font-medium text-crimson group-hover:text-sakura transition-colors">
              Đọc ngay
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {rest.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-gunmetal/60 bg-graphite transition-all hover:border-rose/40"
            >
              {post.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-2 text-xs text-steelgray">{post.created_at}</p>
                <h3 className="flex-1 text-base font-bold text-warmwhite leading-snug group-hover:text-sakura transition-colors line-clamp-3">
                  {post.title}
                </h3>
                <span className="mt-3 flex items-center gap-1 text-sm font-medium text-crimson group-hover:text-sakura transition-colors">
                  Đọc thêm
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
