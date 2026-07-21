import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const MEDIA_WAIT_TIMEOUT_MS = 12_000;
const PREPARING_SCREEN_DELAY_MS = 180;

function nextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function isImportantImage(image: HTMLImageElement) {
  if (image.loading === "eager" || image.fetchPriority === "high") return true;

  const rect = image.getBoundingClientRect();
  return rect.top < window.innerHeight * 1.5 && rect.bottom > -100;
}

async function waitForImportantImages(root: HTMLElement, signal: AbortSignal) {
  const deadline = Date.now() + MEDIA_WAIT_TIMEOUT_MS;
  let stablePasses = 0;

  while (!signal.aborted && Date.now() < deadline && stablePasses < 2) {
    await nextPaint();

    const images = Array.from(root.querySelectorAll("img")).filter(isImportantImage);
    const pendingImages = images.filter((image) => !image.complete);

    if (pendingImages.length === 0) {
      // Two stable passes also cover OptimizedImage replacing a failed srcset
      // candidate with the canonical image on the following React render.
      stablePasses += 1;
      continue;
    }

    stablePasses = 0;
    await Promise.race([
      Promise.all(
        pendingImages.map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
      ),
      new Promise<void>((resolve) => window.setTimeout(resolve, 250)),
    ]);
  }

  const fonts = document.fonts;
  if (!signal.aborted && fonts?.status === "loading") {
    await Promise.race([
      fonts.ready.then(() => undefined),
      new Promise<void>((resolve) => window.setTimeout(resolve, 2_000)),
    ]);
  }
}

function PagePreparingScreen() {
  return (
    <div
      className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-aurora-bg-deep"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 animate-spin-slow rounded-full bg-aurora-gradient opacity-80 blur-sm" />
          <div className="absolute inset-1 rounded-full bg-aurora-bg-deep" />
          <div className="absolute inset-3 rounded-full border border-sakura/30 bg-white/[0.04] shadow-glow" />
        </div>
        <span className="aurora-text-gradient text-xl font-extrabold uppercase tracking-[0.32em]">
          CellZone
        </span>
        <span className="sr-only">Đang chuẩn bị trang</span>
      </div>
    </div>
  );
}

export function PageFallback() {
  return <PagePreparingScreen />;
}

export default function PageReadyGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const revealedRouteRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [showPreparingScreen, setShowPreparingScreen] = useState(false);
  const { loading: authLoading } = useAuth();
  const { loading: cartLoading } = useCart();
  const initialFetches = useIsFetching({
    predicate: (query) => query.state.data === undefined,
  });
  const blocked = authLoading || cartLoading || initialFetches > 0;
  // Query-string changes are normally filters/sorts within the current page,
  // not a new page transition, so they must never trigger the full-screen gate.
  const routeKey = location.pathname;

  useLayoutEffect(() => {
    setReady(false);
    setShowPreparingScreen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [routeKey]);

  useEffect(() => {
    if (ready) {
      setShowPreparingScreen(false);
      return;
    }

    // Cached/instant routes usually finish before this timer, avoiding a
    // distracting CellZone flash during fast navigation.
    const timer = window.setTimeout(() => setShowPreparingScreen(true), PREPARING_SCREEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, routeKey]);

  useEffect(() => {
    // Once a route has been revealed, background refetches and queries mounted
    // later on the page are never allowed to cover the UI again.
    if (revealedRouteRef.current === routeKey) return;
    if (blocked || !contentRef.current) return;

    const controller = new AbortController();
    const root = contentRef.current;

    void waitForImportantImages(root, controller.signal).then(() => {
      if (!controller.signal.aborted) {
        revealedRouteRef.current = routeKey;
        setReady(true);
      }
    });

    return () => controller.abort();
  }, [blocked, routeKey]);

  return (
    <div className="min-h-screen bg-aurora-bg-deep" aria-busy={!ready}>
      <div ref={contentRef} className={ready ? "" : "invisible"} aria-hidden={!ready}>
        {children}
      </div>
      {!ready && showPreparingScreen && <PagePreparingScreen />}
    </div>
  );
}
