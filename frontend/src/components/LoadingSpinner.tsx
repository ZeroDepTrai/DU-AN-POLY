export default function LoadingSpinner({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-16 w-16">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            backgroundImage:
              "conic-gradient(from 0deg, #D94A63, #A82F49, #F28CA6, #E36A86, #D94A63)",
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