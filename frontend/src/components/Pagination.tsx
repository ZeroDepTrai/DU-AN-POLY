import { Link } from "react-router-dom";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, onPageChange, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gunmetal bg-graphite text-steelgray transition-colors hover:border-silvergray hover:text-warmwhite disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Trang trước"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-10 w-10 items-center justify-center text-steelgray">…</span>
        ) : (
          baseUrl ? (
            <Link
              key={page}
              to={`${baseUrl}?page=${page}`}
              onClick={() => onPageChange(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                page === currentPage
                  ? "border-crimson bg-crimson text-white"
                  : "border-gunmetal bg-graphite text-warmwhite hover:border-silvergray"
              }`}
            >
              {page}
            </Link>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                page === currentPage
                  ? "border-crimson bg-crimson text-white"
                  : "border-gunmetal bg-graphite text-warmwhite hover:border-silvergray"
              }`}
            >
              {page}
            </button>
          )
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-gunmetal bg-graphite text-steelgray transition-colors hover:border-silvergray hover:text-warmwhite disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Trang sau"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
