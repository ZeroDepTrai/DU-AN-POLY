import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Centralised caching policy: every useQuery without its own staleTime gets
// these defaults, so navigating between Shop / Home / Accessories no longer
// refetches the catalog on every mount. Admin writes still invalidate
// explicitly where they need to.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat a list response as fresh for 60s — admin mutation will refetch
      // explicitly when needed.
      staleTime: 60_000,
      // Keep unused pages in memory for 5 minutes so back-nav is instant.
      gcTime: 5 * 60_000,
      // Don't re-fire the network when the user tabs back in.
      refetchOnWindowFocus: false,
      // Don't refetch when the same component remounts (StrictMode, back-nav).
      refetchOnMount: false,
      // One stale retry is enough — show UI faster.
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
