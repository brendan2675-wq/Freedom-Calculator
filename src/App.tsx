import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";

// One-time cleanup for testers who have the old seeded Parramatta/Liverpool data.
// Runs once per browser, then never again. Real user data is never touched.
const SEED_CLEANUP_FLAG = "seed-cleanup-v1";
if (!localStorage.getItem(SEED_CLEANUP_FLAG)) {
  try {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === 2) {
        const ids = parsed.map((p: { id?: string }) => p?.id).sort();
        const names = parsed.map((p: { nickname?: string }) => p?.nickname).sort();
        const isSeeded =
          ids[0] === "1" && ids[1] === "2" &&
          names.includes("Parramatta") && names.includes("Liverpool");
        if (isSeeded) {
          localStorage.removeItem("portfolio-properties");
          localStorage.removeItem("portfolio-future-properties");
        }
      }
    }
  } catch {
    // ignore — non-blocking cleanup
  }
  localStorage.setItem(SEED_CLEANUP_FLAG, "1");
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ppor-goal" element={<Index />} />
          <Route path="/portfolio" element={<Portfolio />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
