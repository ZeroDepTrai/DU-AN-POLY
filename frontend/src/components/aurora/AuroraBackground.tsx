import { useEffect, useState, type CSSProperties } from "react";

interface Orb {
  id: number;
  className: string;
  style: CSSProperties;
}

const ORBS: Orb[] = [
  {
    id: 1,
    className: "animate-aurora-pan",
    style: {
      top: "-15%",
      left: "-10%",
      width: "55vw",
      height: "55vw",
      backgroundImage:
        "radial-gradient(circle at 30% 30%, rgba(242,140,166,0.55), transparent 65%)",
      filter: "blur(70px)",
    },
  },
  {
    id: 2,
    className: "animate-aurora-tilt",
    style: {
      top: "20%",
      right: "-15%",
      width: "50vw",
      height: "50vw",
      backgroundImage:
        "radial-gradient(circle at 60% 40%, rgba(242,140,166,0.45), transparent 65%)",
      filter: "blur(80px)",
    },
  },
  {
    id: 3,
    className: "animate-aurora-pan",
    style: {
      bottom: "-20%",
      left: "20%",
      width: "60vw",
      height: "60vw",
      backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(242,140,166,0.40), transparent 65%)",
      filter: "blur(90px)",
      animationDelay: "-8s",
    },
  },
  {
    id: 4,
    className: "animate-aurora-tilt",
    style: {
      top: "55%",
      left: "30%",
      width: "40vw",
      height: "40vw",
      backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(242,140,166,0.40), transparent 65%)",
      filter: "blur(80px)",
      animationDelay: "-4s",
    },
  },
];

export default function AuroraBackground() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-aurora-bg-deep"
    >
      <div className="absolute inset-0 bg-aurora-mesh opacity-70" />
      {!reduced &&
        ORBS.map((o) => (
          <div
            key={o.id}
            className={`absolute rounded-full ${o.className}`}
            style={o.style}
          />
        ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.55),transparent_60%)]" />
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}