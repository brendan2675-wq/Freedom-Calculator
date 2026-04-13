import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Building2, Landmark, TrendingUp, Home, Plus, RotateCcw, ArrowUpRight, ArrowDownRight, DollarSign, Activity } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import AuthFlow from "@/components/AuthFlow";
import ExistingProperties from "@/components/ExistingProperties";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import PporDetailSheet from "@/components/PporDetailSheet";
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
  const [pporSuburb, setPporSuburb] = useState(() => localStorage.getItem("ppor-suburb") || "Bella Vista");
  const [interestRate] = useState(6.2);
  const handleSetPporSuburb = (v: string) => {
    setPporSuburb(v);
    localStorage.setItem("ppor-suburb", v);
  };

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

  // Growth since purchase
  const pporGrowth = useMemo(() => {
    if (!ppor || !ppor.purchase?.purchasePrice || ppor.purchase.purchasePrice === 0) return null;
    const diff = ppor.estimatedValue - ppor.purchase.purchasePrice;
    const pct = (diff / ppor.purchase.purchasePrice) * 100;
    return { diff, pct };
  }, [ppor]);

  // Sell-down proceeds for progress tracker
  const sellDownProceeds = useMemo(() => {
    return properties
      .filter(p => p.earmarked && p.sellInYears === 0)
      .reduce((sum, p) => sum + Math.max(0, p.estimatedValue - p.loanBalance), 0);
  }, [properties]);

  const pporPaydownPct = useMemo(() => {
    if (!ppor || ppor.loanBalance === 0) return 0;
    const originalLoan = ppor.purchase?.purchasePrice
      ? ppor.purchase.purchasePrice * 0.8
      : ppor.loanBalance;
    if (originalLoan === 0) return 0;
    const netBalance = Math.max(0, ppor.loanBalance - sellDownProceeds);
    return Math.min(100, ((originalLoan - netBalance) / originalLoan) * 100);
  }, [ppor, sellDownProceeds]);
  const totals = useMemo(() => {
    const investmentValue = properties.reduce((s, p) => s + p.estimatedValue, 0);
    const investmentLoan = properties.reduce((s, p) => s + p.loanBalance, 0);
    const investmentEquity = properties.reduce((s, p) => s + Math.max(0, (p.estimatedValue * masterLvr) - p.loanBalance), 0);
    const pporValue = ppor?.estimatedValue ?? 0;
    const pporLoan = ppor?.loanBalance ?? 0;
    const totalValue = pporValue + investmentValue;
    const totalLoan = pporLoan + investmentLoan;
    const totalEquity = pporEquity + investmentEquity;
    const avgLvr = totalValue > 0 ? (totalLoan / totalValue) * 100 : 0;
    return { totalValue, totalLoan, totalEquity, avgLvr };
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
            <Activity size={24} className="text-accent" />
            <span className="text-sm text-muted-foreground">Average LVR</span>
            <span className={`text-2xl font-bold ${totals.avgLvr > 80 ? 'text-destructive' : totals.avgLvr > 60 ? 'text-accent' : 'text-foreground'}`}>{totals.avgLvr.toFixed(1)}%</span>
          </div>
        </div>

        {/* Owner Occupied Property */}
        {ppor ? (
          <section>
            <div className="gold-underline pb-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <Home size={26} strokeWidth={2.25} className="text-accent" />
                Owner Occupied Property
              </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
              {/* Main PPOR Card */}
              <div
                onClick={() => setPporSheetOpen(true)}
                className="bg-card rounded-xl p-5 border-2 border-accent/30 shadow-sm cursor-pointer hover:shadow-xl hover:border-accent hover:shadow-accent/10 transition-all relative group"
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold ml-auto">PPOR</span>
                </div>

                {/* Current Value with Growth */}
                <div className="mb-4">
                  <label className="text-muted-foreground text-[11px] block mb-0.5">Current Value</label>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">${ppor.estimatedValue.toLocaleString()}</span>
                    {pporGrowth && (
                      <span className={`text-xs font-semibold flex items-center gap-0.5 ${pporGrowth.pct >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {pporGrowth.pct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {pporGrowth.pct >= 0 ? '↑' : '↓'}{Math.abs(pporGrowth.pct).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {ppor.purchase?.purchasePrice > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Purchased at ${ppor.purchase.purchasePrice.toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Loan & Equity Row */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-muted-foreground text-[11px] block mb-0.5">Current Loan</label>
                    <p className="text-foreground font-bold text-lg">${ppor.loanBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px] block mb-0.5">Equity Available</label>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-lg ${pporEquity >= 50000 ? 'text-green-600' : 'text-accent'}`}>${pporEquity.toLocaleString()}</span>
                      <select
                        value={pporLvr}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); setPporLvr(Number(e.target.value)); }}
                        className="py-0.5 px-1 rounded border border-border bg-background text-foreground text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.88}>88%</option>
                        <option value={0.9}>90%</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>



            </div>
          </section>
        ) : (
          <section>
            <div className="gold-underline pb-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <Home size={26} strokeWidth={2.25} className="text-accent" />
                Owner Occupied Property
              </h2>
            </div>
            <button
              onClick={addPpor}
              className="rounded-xl border-2 border-dashed border-border/40 p-4 flex items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-muted-foreground hover:text-accent max-w-sm"
            >
              <Plus size={18} />
              <span className="text-sm">Add Owner Occupied Property</span>
            </button>
          </section>
        )}

        {/* Investment Properties */}
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
