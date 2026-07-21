import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const MEDIA_WAIT_TIMEOUT_MS = 12_000;
const PREPARING_SCREEN_DELAY_MS = 180;
const MIN_NAVIGATION_PROGRESS_MS = 320;

const SuspenseLoadingContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

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

function NavigationProgress() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[10000] h-1 overflow-hidden bg-white/5" role="progressbar" aria-label="Đang chuyển trang">
      <div className="page-navigation-progress h-full bg-aurora-gradient shadow-[0_0_14px_rgba(242,140,166,0.9)]" />
    </div>
  );
}

export function PageFallback() {
  const setSuspenseLoading = useContext(SuspenseLoadingContext);

  useEffect(() => {
    setSuspenseLoading?.(true);
    return () => setSuspenseLoading?.(false);
  }, [setSuspenseLoading]);

  return <NavigationProgress />;
}

export default function PageReadyGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);
  const hasBootedRef = useRef(false);
  const navigationStartedAtRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [suspenseLoading, setSuspenseLoading] = useState(false);
  const [showPreparingScreen, setShowPreparingScreen] = useState(false);
  const { loading: authLoading } = useAuth();
  const { loading: cartLoading } = useCart();
  const initialFetches = useIsFetching({
    predicate: (query) => query.state.data === undefined,
  });
  const blocked = authLoading || cartLoading || initialFetches > 0;
  const routeKey = location.pathname;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (hasBootedRef.current) {
      navigationStartedAtRef.current = Date.now();
      setNavigating(true);
    }
  }, [routeKey]);

  useEffect(() => {
    const handleInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      navigationStartedAtRef.current = Date.now();
      setNavigating(true);
    };

    document.addEventListener("click", handleInternalLink, true);
    return () => document.removeEventListener("click", handleInternalLink, true);
  }, []);

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
    if (blocked || suspenseLoading || !contentRef.current) return;
    if (hasBootedRef.current && !navigating) return;

    const controller = new AbortController();
    const root = contentRef.current;

    void waitForImportantImages(root, controller.signal).then(async () => {
      if (!controller.signal.aborted) {
        if (!hasBootedRef.current) {
          hasBootedRef.current = true;
          setReady(true);
          return;
        }

        const elapsed = Date.now() - navigationStartedAtRef.current;
        const remaining = Math.max(0, MIN_NAVIGATION_PROGRESS_MS - elapsed);
        if (remaining > 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
        }
        if (!controller.signal.aborted) setNavigating(false);
      }
    });

    return () => controller.abort();
  }, [blocked, navigating, routeKey, suspenseLoading]);

  return (
    <SuspenseLoadingContext.Provider value={setSuspenseLoading}>
      <div className="min-h-screen bg-aurora-bg-deep" aria-busy={!ready || navigating}>
        <div ref={contentRef} className={ready ? "" : "invisible"} aria-hidden={!ready}>
          {children}
        </div>
        {!ready && showPreparingScreen && <PagePreparingScreen />}
        {ready && (navigating || suspenseLoading) && <NavigationProgress />}
      </div>
    </SuspenseLoadingContext.Provider>
  );
}
