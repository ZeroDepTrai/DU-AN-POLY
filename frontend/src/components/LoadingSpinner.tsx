interface LoadingSpinnerProps {
  label?: string;
}

export default function LoadingSpinner({ label = "Đang tải..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-gunmetal border-t-crimson" />
        <div className="absolute inset-2 animate-spin rounded-full border-2 border-rose/40 border-t-transparent" />
      </div>
      <p className="text-sm text-steelgray">{label}</p>
    </div>
  );
}
