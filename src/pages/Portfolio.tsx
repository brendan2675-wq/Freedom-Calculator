import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Building2, Landmark, TrendingUp, Home, Plus, RotateCcw } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import AuthFlow from "@/components/AuthFlow";
import ExistingProperties from "@/components/ExistingProperties";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

const Portfolio = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState(() => localStorage.getItem("client-name") || "Client Name");
  const [authOpen, setAuthOpen] = useState(false);
  const handleSetClientName = (name: string) => {
    setClientName(name);
    localStorage.setItem("client-name", name);
  };
  const [properties, setProperties] = useState<ExistingProperty[]>([]);
  const [ppor, setPpor] = useState<ExistingProperty | null>(null);
  const [pporSheetOpen, setPporSheetOpen] = useState(false);
  const [pporLvr, setPporLvr] = useState(0.8);
  const [masterLvr, setMasterLvr] = useState(0.8);

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
    const investmentEquity = properties.reduce((s, p) => s + Math.max(0, (p.estimatedValue * masterLvr) - p.loanBalance), 0);
    const pporValue = ppor?.estimatedValue ?? 0;
    const pporLoan = ppor?.loanBalance ?? 0;
    const totalValue = pporValue + investmentValue;
    const totalLoan = pporLoan + investmentLoan;
    const totalEquity = pporEquity + investmentEquity;
    return { totalValue, totalLoan, totalEquity };
  }, [properties, ppor?.estimatedValue, ppor?.loanBalance, pporEquity, masterLvr]);

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
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={() => {
                if (window.confirm("Reset all data to defaults? This cannot be undone.")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
              aria-label="Reset data"
            >
              <RotateCcw size={14} />
              Reset
            </button>
            <div className="flex flex-col items-center gap-1">
              <p className="text-accent text-sm tracking-wider mb-1">Atelier Wealth</p>
              <button
                onClick={() => setAuthOpen(true)}
                className="text-accent hover:text-accent/80 transition-colors"
                aria-label="Profile"
              >
                <UserCircle size={44} />
              </button>
              <AuthFlow open={authOpen} onOpenChange={setAuthOpen} clientName={clientName} setClientName={handleSetClientName} />
              <input
                value={clientName}
                onChange={(e) => handleSetClientName(e.target.value)}
                className="text-center text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-32 md:w-40"
                placeholder="Client name"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
            <Building2 size={24} className="text-accent" />
            <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
            <span className="text-2xl font-bold text-foreground">${totals.totalValue.toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
            <Landmark size={24} className="text-accent" />
            <span className="text-sm text-muted-foreground">Total Loans</span>
            <span className="text-2xl font-bold text-destructive">${totals.totalLoan.toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
            <TrendingUp size={24} className="text-accent" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">Available Equity</span>
              <select
                value={masterLvr}
                onChange={(e) => {
                  const newLvr = Number(e.target.value);
                  setMasterLvr(newLvr);
                  setPporLvr(newLvr);
                }}
                className="py-0.5 px-1 rounded border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
              >
                <option value={0.8}>80%</option>
                <option value={0.88}>88%</option>
                <option value={0.9}>90%</option>
              </select>
            </div>
            <span className="text-2xl font-bold text-accent">${totals.totalEquity.toLocaleString()}</span>
          </div>
        </div>

        {/* Properties Row: PPOR (pinned) + Investment Carousel */}
        <section>
          <div className="gold-underline pb-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Home size={26} strokeWidth={2.25} className="text-accent" />
              Your Properties
            </h2>
          </div>
          <div className="flex gap-3 items-start">
            {/* PPOR Card - pinned, not in carousel */}
            <div className="shrink-0" style={{ width: "calc((100% - 36px) / 4)", minWidth: "200px" }}>
              {ppor ? (
                <div
                  onClick={() => setPporSheetOpen(true)}
                  className="bg-card rounded-xl shadow-md p-4 border-2 border-accent/30 cursor-pointer hover:shadow-xl hover:border-accent hover:shadow-accent/10 transition-all relative group flex flex-col"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); removePpor(); }}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove PPOR"
                  >
                    <X size={14} />
                  </button>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Home size={16} className="text-accent shrink-0" />
                    <p className="font-semibold text-sm text-foreground truncate">{ppor.nickname || "Owner Occupied"}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold ml-auto shrink-0">PPOR</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    <div>
                      <label className="text-muted-foreground text-[11px]">Current Value</label>
                      <p className="text-foreground font-medium">${ppor.estimatedValue.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px]">Current Loan</label>
                      <p className="text-foreground font-medium">${ppor.loanBalance.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px]">Equity Available</label>
                      <div className="flex items-center gap-1">
                        <span className="text-accent font-bold">${pporEquity.toLocaleString()}</span>
                        <select
                          value={pporLvr}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); setPporLvr(Number(e.target.value)); }}
                          className="py-0.5 px-1 rounded border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                        >
                          <option value={0.8}>80%</option>
                          <option value={0.88}>88%</option>
                          <option value={0.9}>90%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border/70 flex items-center gap-1.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {ppor.ownership === "trust" ? (ppor.trustName || "Trust") : "Personal"}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={addPpor}
                  className="rounded-xl border-2 border-dashed border-accent/30 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent/70 hover:text-accent w-full h-full min-h-[140px]"
                >
                  <Home size={20} />
                  <span className="text-xs">Add PPOR</span>
                </button>
              )}
            </div>

            {/* Investment Properties Carousel */}
            <div className="min-w-0 flex-1">
              <ExistingProperties
                properties={properties}
                setProperties={handleSetProperties}
                targetMonth={2}
                targetYear={2036}
                growthRate={6}
                portfolioMode
                hideHeader
              />
            </div>
          </div>
        </section>

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
