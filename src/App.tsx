import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Portfolio from "./pages/Portfolio";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

// Seed localStorage with default portfolio if empty
if (!localStorage.getItem("portfolio-properties")) {
  const defaults = [
    { id: "1", nickname: "Parramatta", estimatedValue: 580000, loanBalance: 480000, earmarked: false, sellInYears: 0, ownership: "trust", investmentType: "unit", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails, purchasePrice: 200000 }, loanSplits: [{ id: "s1", label: "Parramatta loan", amount: 400000 }, { id: "s2", label: "Liverpool equity", amount: 80000 }] },
    { id: "2", nickname: "Liverpool", estimatedValue: 750000, loanBalance: 530000, earmarked: false, sellInYears: 0, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails } },
  ];
  localStorage.setItem("portfolio-properties", JSON.stringify(defaults));
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
