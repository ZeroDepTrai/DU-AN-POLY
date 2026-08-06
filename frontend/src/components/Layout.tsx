import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Footer from "./Footer";
import Header from "./Header";

export default function Layout() {
  const location = useLocation();

  // Scroll to top whenever the route changes (route transitions are
  // handled by PageReadyGate; this is a safety net for browsers that
  // preserve scroll on pushState).
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-charcoal text-warmwhite">
      <Header />
      <main id="content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
