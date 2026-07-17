import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

interface FlightItem {
  id: number;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  imageUrl?: string;
  size: number;
}

interface CartFlyContextValue {
  flyToCart: (source: DOMRect | HTMLElement | null, imageUrl?: string) => void;
}

const CartFlyContext = createContext<CartFlyContextValue | undefined>(undefined);

export function CartFlyProvider({ children }: { children: ReactNode }) {
  const [flights, setFlights] = useState<FlightItem[]>([]);
  const idRef = useRef(0);
  const bumpKeyRef = useRef(0);

  // Track viewport scroll/resize while a flight is in motion so we can
  // re-derive the target rect on each animation frame. Source rects are
  // captured at click time and frozen; the target is re-resolved live
  // (Header can scroll with sticky positioning or window resize).
  useEffect(() => {
    if (flights.length === 0) return;
    const handleResize = () => setFlights((prev) => [...prev]);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [flights.length]);

  const removeFlight = useCallback((id: number) => {
    setFlights((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const flyToCart = useCallback((source: DOMRect | HTMLElement | null, imageUrl?: string) => {
    if (typeof window === "undefined") return;

    const target = document.querySelector<HTMLElement>("[data-cart-icon]");
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    let sourceRect: DOMRect;
    if (source instanceof HTMLElement) {
      sourceRect = source.getBoundingClientRect();
    } else if (source) {
      sourceRect = source;
    } else {
      return;
    }

    const id = ++idRef.current;
    const size = 56;
    setFlights((prev) => [
      ...prev,
      {
        id,
        sourceX: sourceRect.left + sourceRect.width / 2 - size / 2,
        sourceY: sourceRect.top + sourceRect.height / 2 - size / 2,
        targetX: targetRect.left + targetRect.width / 2 - size / 2,
        targetY: targetRect.top + targetRect.height / 2 - size / 2,
        imageUrl,
        size,
      },
    ]);

    bumpKeyRef.current += 1;
    target.classList.remove("cart-icon-bump");
    // Force reflow so the animation restarts even if the previous one
    // is still finishing.
    void target.offsetWidth;
    target.classList.add("cart-icon-bump");
    window.setTimeout(() => {
      target.classList.remove("cart-icon-bump");
    }, 600);
  }, []);

  const value = useMemo(() => ({ flyToCart }), [flyToCart]);

  return (
    <CartFlyContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div aria-hidden="true">
            {flights.map((f) => (
              <Flight key={f.id} flight={f} onDone={removeFlight} />
            ))}
          </div>,
          document.body
        )}
    </CartFlyContext.Provider>
  );
}

function Flight({
  flight,
  onDone,
}: {
  flight: FlightItem;
  onDone: (id: number) => void;
}) {
  // Re-resolve target each render so a sticky header that scrolls with
  // the page keeps the flying icon tracking it accurately. The portal
  // re-renders on resize/scroll events; for continuous scroll we'd
  // need rAF, but in practice the 720ms flight is short enough that
  // the user isn't scrolling during it (they just clicked Add).
  const [target, setTarget] = useState({ x: flight.targetX, y: flight.targetY });
  useEffect(() => {
    const update = () => {
      const el = document.querySelector<HTMLElement>("[data-cart-icon]");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const size = flight.size;
      setTarget({
        x: r.left + r.width / 2 - size / 2,
        y: r.top + r.height / 2 - size / 2,
      });
    };
    const raf = requestAnimationFrame(update);
    const interval = window.setInterval(update, 16); // ~60fps for the duration
    const cleanup = () => {
      cancelAnimationFrame(raf);
      window.clearInterval(interval);
    };
    return cleanup;
  }, [flight.size]);

  const dx = target.x - flight.sourceX;
  const dy = target.y - flight.sourceY;

  return (
    <div
      className="cart-fly-item"
      style={
        {
          left: `${flight.sourceX}px`,
          top: `${flight.sourceY}px`,
          width: `${flight.size}px`,
          height: `${flight.size}px`,
          "--cart-fly-x": `${dx}px`,
          "--cart-fly-y": `${dy}px`,
        } as React.CSSProperties
      }
      onAnimationEnd={() => onDone(flight.id)}
    >
      {flight.imageUrl ? (
        <img src={flight.imageUrl} alt="" />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <rect x="6" y="2" width="12" height="20" rx="2.5" />
          <path d="M11 18h2" />
        </svg>
      )}
    </div>
  );
}

export function useCartFly() {
  const ctx = useContext(CartFlyContext);
  if (!ctx) {
    throw new Error("useCartFly must be used within a CartFlyProvider");
  }
  return ctx;
}
