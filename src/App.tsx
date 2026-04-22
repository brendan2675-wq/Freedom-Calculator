import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import Login from "./pages/Login";
import AdviserHome from "./pages/AdviserHome";
import AgentHome from "./pages/AgentHome";
import CashflowTracker from "./pages/CashflowTracker";
import RoleGuard from "./components/RoleGuard";
import { getRole, landingFor } from "./lib/auth";

const RootRedirect = () => {
  const role = getRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role === "client") return <Home />;
  return <Navigate to={landingFor(role)} replace />;
};

const DashboardRoute = () => {
  const role = getRole();
  if (!role) return <Navigate to="/login" replace />;
  if (role === "agent") return <Navigate to="/agent" replace />;
  return <Home />;
};

// One-time cleanup for testers who have the old seeded Parramatta/Liverpool data
// and the seeded PPOR loan/value defaults. Runs once per browser, then never again.
const SEED_CLEANUP_FLAG = "seed-cleanup-v2";
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

    // Clear seeded PPOR loan-to-pay-down values so testers see a blank slate.
    const pporRaw = localStorage.getItem("portfolio-ppor");
    if (pporRaw) {
      const ppor = JSON.parse(pporRaw);
      const seededLoan = ppor?.loanBalance === 1750000;
      const seededValue = ppor?.estimatedValue === 2750000;
      if (seededLoan || seededValue) {
        const cleaned = {
          ...ppor,
          loanBalance: seededLoan ? 0 : ppor.loanBalance,
          estimatedValue: seededValue ? 0 : ppor.estimatedValue,
          loanSplits: seededLoan ? [] : ppor.loanSplits,
        };
        localStorage.setItem("portfolio-ppor", JSON.stringify(cleaned));
      }
    }
    const startingRaw = localStorage.getItem("ppor-starting-balance");
    if (startingRaw && parseInt(startingRaw, 10) === 1850000) {
      localStorage.removeItem("ppor-starting-balance");
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
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route
            path="/adviser"
            element={
              <RoleGuard allow={["adviser"]}>
                <AdviserHome />
              </RoleGuard>
            }
          />
          <Route
            path="/agent"
            element={
              <RoleGuard allow={["agent"]}>
                <AgentHome />
              </RoleGuard>
            }
          />
          <Route
            path="/ppor-goal"
            element={
              <RoleGuard allow={["client", "adviser"]}>
                <Index />
              </RoleGuard>
            }
          />
          <Route
            path="/portfolio"
            element={
              <RoleGuard allow={["client", "adviser", "agent"]}>
                <Portfolio />
              </RoleGuard>
            }
          />
          <Route
            path="/cashflow"
            element={
              <RoleGuard allow={["client", "adviser"]}>
                <CashflowTracker />
              </RoleGuard>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
