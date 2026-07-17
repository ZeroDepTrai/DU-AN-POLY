export default function LoadingSpinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              "conic-gradient(from 0deg, #5B6CFF, #8B5CF6, #22D3EE, #34D399, #5B6CFF)",
            maskImage: "radial-gradient(circle, transparent 50%, black 51%)",
            WebkitMaskImage: "radial-gradient(circle, transparent 50%, black 51%)",
          }}
        >
          <div className="animate-spin-slow h-full w-full" />
        </div>
        <div className="absolute inset-2 rounded-full border border-white/10 bg-aurora-bg-deep" />
      </div>
      <span className="text-sm text-softgray">{label}</span>
    </div>
  );
}