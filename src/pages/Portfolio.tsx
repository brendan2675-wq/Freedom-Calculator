import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Building2, Landmark, TrendingUp, Home, Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import ExistingProperties from "@/components/ExistingProperties";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

const Portfolio = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("Client Name");
  const [properties, setProperties] = useState<ExistingProperty[]>([]);
  const [ppor, setPpor] = useState<ExistingProperty | null>(null);
  const [pporSheetOpen, setPporSheetOpen] = useState(false);
  const [pporLvr, setPporLvr] = useState(0.8);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      try { setProperties(JSON.parse(stored)); } catch {}
    }
    const storedPpor = localStorage.getItem("portfolio-ppor");
    if (storedPpor) {
      try { setPpor(JSON.parse(storedPpor)); } catch {}
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "portfolio-properties" && e.newValue) {
        try { setProperties(JSON.parse(e.newValue)); } catch {}
      }
      if (e.key === "portfolio-ppor" && e.newValue) {
        try { setPpor(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSetProperties = (p: ExistingProperty[]) => {
    setProperties(p);
    localStorage.setItem("portfolio-properties", JSON.stringify(p));
  };

  const addPpor = () => {
    const newPpor: ExistingProperty = {
      id: "ppor",
      nickname: "",
      estimatedValue: 0,
      loanBalance: 0,
      earmarked: false,
      sellInYears: 0,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails },
      rental: { ...defaultRentalDetails },
      purchase: { ...defaultPurchaseDetails },
    };
    setPpor(newPpor);
    localStorage.setItem("portfolio-ppor", JSON.stringify(newPpor));
    setPporSheetOpen(true);
  };

  const handleUpdatePpor = (updated: ExistingProperty) => {
    setPpor(updated);
    localStorage.setItem("portfolio-ppor", JSON.stringify(updated));
  };

  const removePpor = () => {
    setPpor(null);
    localStorage.removeItem("portfolio-ppor");
  };

  const pporEquity = ppor ? Math.max(0, (ppor.estimatedValue * pporLvr) - ppor.loanBalance) : 0;

  const totals = useMemo(() => {
    const investmentValue = properties.reduce((s, p) => s + p.estimatedValue, 0);
    const investmentLoan = properties.reduce((s, p) => s + p.loanBalance, 0);
    const investmentEquity = properties.reduce((s, p) => s + Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance), 0);
    const pporValue = ppor?.estimatedValue ?? 0;
    const pporLoan = ppor?.loanBalance ?? 0;
    const totalValue = pporValue + investmentValue;
    const totalLoan = pporLoan + investmentLoan;
    const totalEquity = pporEquity + investmentEquity;
    return { totalValue, totalLoan, totalEquity };
  }, [properties, ppor?.estimatedValue, ppor?.loanBalance, pporEquity]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="w-14 h-14 rounded-xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent hover:bg-accent/25 hover:border-accent/50 transition-all"
              aria-label="Back to Dashboard"
            >
              <LayoutDashboard size={32} />
            </button>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3">Your Portfolio</h1>
              <p className="text-accent text-lg md:text-xl font-light">
                View and manage your full property portfolio
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <p className="text-accent text-sm tracking-wider mb-1">Atelier Wealth</p>
            <UserCircle size={44} className="text-accent" />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="text-center text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-32 md:w-40"
              placeholder="Client name"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Building2, label: "Total Portfolio Value", value: `$${totals.totalValue.toLocaleString()}`, color: "text-foreground" },
            { icon: Landmark, label: "Total Loans", value: `$${totals.totalLoan.toLocaleString()}`, color: "text-destructive" },
            { icon: TrendingUp, label: "Available Equity (80%)", value: `$${totals.totalEquity.toLocaleString()}`, color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
              <stat.icon size={24} className="text-accent" />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Owner Occupied Property */}
        <section>
          <div className="gold-underline pb-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Home size={26} strokeWidth={2.25} className="text-accent" />
              Owner Occupied Property
            </h2>
          </div>
          {ppor ? (
            <div
              onClick={() => setPporSheetOpen(true)}
              className="bg-card rounded-xl p-6 border-2 border-border shadow-sm max-w-xl cursor-pointer hover:shadow-xl hover:border-accent hover:shadow-accent/10 transition-all relative group"
            >
              <button
                onClick={(e) => { e.stopPropagation(); removePpor(); }}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove PPOR"
              >
                <span className="text-xs">✕</span>
              </button>
              <div className="flex items-center gap-1.5 mb-3">
                <Home size={16} className="text-accent shrink-0" />
                <p className="font-semibold text-sm text-foreground">{ppor.nickname || "Owner Occupied"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-muted-foreground text-[11px] block mb-1">Property Value</label>
                  <p className="text-foreground font-medium text-sm">${ppor.estimatedValue.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px] block mb-1">Loan Balance</label>
                  <p className="text-foreground font-medium text-sm">${ppor.loanBalance.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px] block mb-1">Equity Avail.</label>
                  <div className="flex items-center gap-1">
                    <span className="text-accent font-bold text-sm">${pporEquity.toLocaleString()}</span>
                    <select
                      value={pporLvr}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        setPporLvr(Number(e.target.value));
                      }}
                      className="py-0.5 px-1 rounded border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                    >
                      <option value={0.8}>80%</option>
                      <option value={0.88}>88%</option>
                      <option value={0.9}>90%</option>
                    </select>
                  </div>
                </div>
              </div>
              {ppor.loan.lenderName && (
                <p className="text-[11px] text-muted-foreground mt-3">
                  Lender: <span className="text-foreground font-medium">{ppor.loan.lenderName}</span>
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={addPpor}
              className="rounded-xl border-2 border-dashed border-accent/40 p-6 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent max-w-xl w-full"
            >
              <Plus size={24} />
              <span className="text-sm">Add Owner Occupied Property</span>
              <span className="text-xs text-muted-foreground font-normal">Click to add your primary residence</span>
            </button>
          )}
        </section>

        {/* Investment Properties Carousel */}
        <ExistingProperties
          properties={properties}
          setProperties={handleSetProperties}
          targetMonth={2}
          targetYear={2036}
          growthRate={6}
          portfolioMode
        />

        {/* PPOR Detail Sheet */}
        {ppor && (
          <PropertyDetailSheet
            property={ppor}
            open={pporSheetOpen}
            onOpenChange={(o) => {
              if (!o && ppor && !ppor.nickname && ppor.estimatedValue === 0) {
                removePpor();
              }
              setPporSheetOpen(o);
            }}
            onUpdate={(updated) => handleUpdatePpor(updated as ExistingProperty)}
            variant="existing"
            portfolioMode
            pporMode
          />
        )}
      </main>
    </div>
  );
};

export default Portfolio;
