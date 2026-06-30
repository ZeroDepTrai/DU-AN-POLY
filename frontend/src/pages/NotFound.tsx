import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <div className="mb-6">
        <span className="text-8xl font-extrabold text-crimson/20">404</span>
      </div>
      <h1 className="mb-3 text-2xl font-bold text-warmwhite">Trang không tồn tại</h1>
      <p className="mb-8 text-steelgray">Trang bạn tìm kiếm không có hoặc đã bị xóa.</p>
      <Link to="/" className="btn-primary">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Quay về trang chủ
      </Link>
    </div>
  );
}
