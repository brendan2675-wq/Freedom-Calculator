import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutDashboard, Building2, Landmark, TrendingUp, Home, Plus, RotateCcw, ArrowUpRight, ArrowDownRight, DollarSign, Activity } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import UserMenu from "@/components/UserMenu";
import ExistingProperties from "@/components/ExistingProperties";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import PporDetailSheet from "@/components/PporDetailSheet";
import ScenarioManager from "@/components/ScenarioManager";
import ReadOnlyBanner from "@/components/ReadOnlyBanner";
import AdviserActingBanner from "@/components/AdviserActingBanner";
import { buildScenarioFromStorage, applyScenarioToStorage } from "@/lib/scenarioManager";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";
import { normalizeExistingProperties } from "@/lib/portfolioDefaults";

const Portfolio = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isReadOnly = searchParams.get("readonly") === "1";
  const [properties, setProperties] = useState<ExistingProperty[]>([]);
  const blankPpor: ExistingProperty = {
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
  const [ppor, setPpor] = useState<ExistingProperty | null>(() => {
    const stored = localStorage.getItem("portfolio-ppor");
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return null;
  });
  const [pporSheetOpen, setPporSheetOpen] = useState(false);
  const [pporLvr, setPporLvr] = useState(0.8);
  const [masterLvr, setMasterLvr] = useState(0.8);
  const [pporSuburb, setPporSuburb] = useState(() => localStorage.getItem("ppor-suburb") || "");
  const [interestRate] = useState(6.5);
  const handleSetPporSuburb = (v: string) => {
    setPporSuburb(v);
    localStorage.setItem("ppor-suburb", v);
  };

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const { properties: normalized, changed } = normalizeExistingProperties(parsed);
        setProperties(normalized);
        if (changed) {
          localStorage.setItem("portfolio-properties", JSON.stringify(normalized));
        }
      } catch {}
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "portfolio-properties" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const { properties: normalized, changed } = normalizeExistingProperties(parsed);
          setProperties(normalized);
          if (changed) {
            localStorage.setItem("portfolio-properties", JSON.stringify(normalized));
          }
        } catch {}
      }
      if (e.key === "portfolio-ppor") {
        if (e.newValue) {
          try { setPpor(JSON.parse(e.newValue)); } catch {}
        } else {
          setPpor(null);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleSetProperties = (p: ExistingProperty[]) => {
    const { properties: normalized } = normalizeExistingProperties(p);
    setProperties(normalized);
    localStorage.setItem("portfolio-properties", JSON.stringify(normalized));
  };

  const addPpor = () => {
    const existingData = localStorage.getItem("portfolio-ppor");
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        setPpor(parsed);
        setPporSheetOpen(true);
        return;
      } catch {}
    }
    setPpor(blankPpor);
    localStorage.setItem("portfolio-ppor", JSON.stringify(blankPpor));
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
    const pporPurchase = ppor?.purchase?.purchasePrice ?? 0;
    const totalValue = pporValue + investmentValue;
    const totalLoan = pporLoan + investmentLoan;
    const totalEquity = pporEquity + investmentEquity;
    const avgLvr = totalValue > 0 ? (totalLoan / totalValue) * 100 : 0;

    // Only include properties with BOTH a purchase price and a current value > 0,
    // otherwise an empty/blank PPOR with a stale purchase price would show -100% growth.
    const growthEligibleProperties = properties.filter(
      (p) => (p.purchase?.purchasePrice ?? 0) > 0 && p.estimatedValue > 0
    );
    const growthInvestmentValue = growthEligibleProperties.reduce((s, p) => s + p.estimatedValue, 0);
    const growthInvestmentPurchase = growthEligibleProperties.reduce((s, p) => s + (p.purchase?.purchasePrice ?? 0), 0);
    const pporGrowthEligible = pporPurchase > 0 && pporValue > 0;
    const growthPporValue = pporGrowthEligible ? pporValue : 0;
    const growthTotalPurchase = (pporGrowthEligible ? pporPurchase : 0) + growthInvestmentPurchase;
    const growthTotalValue = growthPporValue + growthInvestmentValue;
    const totalGrowthPct = growthTotalPurchase > 0 ? ((growthTotalValue - growthTotalPurchase) / growthTotalPurchase) * 100 : 0;

    return { totalValue, totalLoan, totalEquity, avgLvr, growthTotalPurchase, totalGrowthPct };
  }, [properties, ppor?.estimatedValue, ppor?.loanBalance, ppor?.purchase?.purchasePrice, pporEquity, masterLvr]);

  return (
    <div className="min-h-screen bg-background">
      <AdviserActingBanner />
      {isReadOnly && <ReadOnlyBanner />}
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-6 md:py-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent hover:bg-accent/25 hover:border-accent/50 transition-all shrink-0"
              aria-label="Back to Dashboard"
            >
              <LayoutDashboard size={24} className="sm:hidden" />
              <LayoutDashboard size={32} className="hidden sm:block" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-3">Your Portfolio</h1>
              <p className="text-accent text-sm sm:text-lg md:text-xl font-light">
                View and manage your full property portfolio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 self-end sm:self-auto">
            <ScenarioManager
              getCurrentState={buildScenarioFromStorage}
              loadState={(s) => {
                applyScenarioToStorage(s);
                window.location.reload();
              }}
            />
            <button
              onClick={() => {
                if (window.confirm("Reset all data to defaults? This cannot be undone.\n\nSaved scenarios will be preserved.")) {
                  const savedScenarios = localStorage.getItem("saved-scenarios");
                  localStorage.clear();
                  if (savedScenarios) localStorage.setItem("saved-scenarios", savedScenarios);
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
              aria-label="Reset data"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-4 py-12 space-y-10 ${isReadOnly ? "pointer-events-none select-none opacity-95" : ""}`}>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm flex flex-col items-center gap-1.5 md:gap-2">
            <Building2 size={20} className="md:hidden text-accent" />
            <Building2 size={24} className="hidden md:block text-accent" />
            <span className="text-xs md:text-sm text-muted-foreground text-center">Total Portfolio Value</span>
            <span className="text-lg md:text-2xl font-bold text-foreground">${totals.totalValue.toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm flex flex-col items-center gap-1.5 md:gap-2">
            <TrendingUp size={20} className="md:hidden text-accent" />
            <TrendingUp size={24} className="hidden md:block text-accent" />
            <span className="text-xs md:text-sm text-muted-foreground text-center">Total Growth</span>
            <span className={`text-lg md:text-2xl font-bold ${totals.totalGrowthPct >= 0 ? 'text-accent' : 'text-destructive'}`}>
              {totals.totalGrowthPct >= 0 ? '↑' : '↓'}{Math.abs(totals.totalGrowthPct).toFixed(0)}%
            </span>
            {totals.growthTotalPurchase > 0 && (
              <span className="text-[10px] text-muted-foreground">from ${totals.growthTotalPurchase.toLocaleString()}</span>
            )}
          </div>
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm flex flex-col items-center gap-1.5 md:gap-2">
            <Landmark size={20} className="md:hidden text-accent" />
            <Landmark size={24} className="hidden md:block text-accent" />
            <span className="text-xs md:text-sm text-muted-foreground text-center">Total Loans</span>
            <span className="text-lg md:text-2xl font-bold text-destructive">${totals.totalLoan.toLocaleString()}</span>
          </div>
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm flex flex-col items-center gap-1.5 md:gap-2">
            <TrendingUp size={20} className="md:hidden text-accent" />
            <TrendingUp size={24} className="hidden md:block text-accent" />
            <span className="text-xs md:text-sm text-muted-foreground text-center">Available Equity</span>
            <span className="text-lg md:text-2xl font-bold text-accent">${totals.totalEquity.toLocaleString()}</span>
            <select
              value={masterLvr}
              onChange={(e) => {
                const newLvr = Number(e.target.value);
                setMasterLvr(newLvr);
                setPporLvr(newLvr);
              }}
              className="py-1 px-2 rounded border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer min-h-[32px]"
            >
              <option value={0.8}>80% LVR</option>
              <option value={0.88}>88% LVR</option>
              <option value={0.9}>90% LVR</option>
            </select>
          </div>
          <div className="bg-card rounded-xl p-4 md:p-6 border border-border shadow-sm flex flex-col items-center gap-1.5 md:gap-2 col-span-2 md:col-span-1">
            <Activity size={20} className="md:hidden text-accent" />
            <Activity size={24} className="hidden md:block text-accent" />
            <span className="text-xs md:text-sm text-muted-foreground text-center">Average LVR</span>
            <span className={`text-lg md:text-2xl font-bold ${totals.avgLvr > 80 ? 'text-destructive' : totals.avgLvr > 60 ? 'text-accent' : 'text-foreground'}`}>{totals.avgLvr.toFixed(1)}%</span>
          </div>
        </div>

        {/* Owner Occupied Property */}
        {ppor ? (
          <section>
            <div className="hidden lg:grid grid-cols-[1fr_1fr] gap-4 mb-4">
              <div className="gold-underline pb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Home size={26} strokeWidth={2.25} className="text-accent" />
                  Owner Occupied Property
                </h2>
              </div>
              <div className="gold-underline pb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Landmark size={26} strokeWidth={2.25} className="text-accent" />
                  SMSF Property
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
              {/* Mobile-only heading above PPOR card */}
              <div className="gold-underline pb-2 lg:hidden">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Home size={26} strokeWidth={2.25} className="text-accent" />
                  Owner Occupied Property
                </h2>
              </div>
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
                  <p className="font-semibold text-sm text-foreground">{pporSuburb || ppor.nickname || "Owner Occupied"}</p>
                </div>

                {/* Current Value + Current Loan (left) | Rate/Term + Equity (right) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Left column: Value & Loan stacked */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Current Value</label>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-foreground">${ppor.estimatedValue.toLocaleString()}</span>
                        {pporGrowth && (
                          <span className={`text-xs font-semibold flex items-center gap-0.5 ${pporGrowth.pct >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                            {pporGrowth.pct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {pporGrowth.pct >= 0 ? '↑' : '↓'}{Math.abs(pporGrowth.pct).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      {ppor.purchase?.purchasePrice > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Purchased at ${ppor.purchase.purchasePrice.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Current Loan</label>
                      <p className="text-foreground font-bold text-lg">${ppor.loanBalance.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Right column: Rate/Term & Equity stacked */}
                  <div className="space-y-3">
                    {(() => {
                      const splits = ppor.loanSplits || [];
                      const totalAmt = splits.reduce((s, sp) => s + sp.amount, 0);
                      let displayRate = 0;
                      let termYears = 0;
                      let termMonths = 0;
                      let hasSplits = splits.length > 0;

                      if (hasSplits) {
                        displayRate = totalAmt > 0
                          ? splits.reduce((s, sp) => s + sp.interestRate * sp.amount, 0) / totalAmt
                          : 0;
                        const maxTermMonths = Math.max(...splits.map(sp => (sp.loanTermYears ?? 30) * 12));
                        termYears = Math.floor(maxTermMonths / 12);
                        termMonths = maxTermMonths % 12;
                      } else {
                        displayRate = ppor.loan?.interestRate ?? interestRate;
                        const baseTerm = ppor.loan?.loanTermYears ?? 30;
                        termYears = baseTerm;
                        termMonths = 0;
                      }

                      if (displayRate === 0 && termYears === 0) return null;

                      return (
                        <div className="flex gap-4">
                          <div>
                            <label className="text-muted-foreground text-[11px] block mb-0.5">Interest Rate</label>
                            <p className="text-foreground font-bold text-sm">{displayRate.toFixed(2)}%</p>
                            {hasSplits && splits.length > 1 && <p className="text-[9px] text-muted-foreground">weighted avg</p>}
                          </div>
                          <div>
                            <label className="text-muted-foreground text-[11px] block mb-0.5">Loan Term</label>
                            <p className="text-foreground font-bold text-sm">{termYears}y{termMonths > 0 ? ` ${termMonths}m` : ''}</p>
                          </div>
                        </div>
                      );
                    })()}
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

              {/* Mobile-only heading above SMSF tile */}
              <div className="gold-underline pb-2 lg:hidden mt-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Landmark size={26} strokeWidth={2.25} className="text-accent" />
                  SMSF Property
                </h2>
              </div>
              {/* SMSF Tile — Coming Soon */}
              <div className="relative bg-card rounded-xl p-5 border-2 border-dashed border-border shadow-sm overflow-hidden">
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wide">Coming Soon</span>
                </div>
                <div className="opacity-40 pointer-events-none select-none">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Landmark size={16} className="text-accent shrink-0" />
                    <p className="font-semibold text-sm text-foreground">SMSF Property</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Fund Balance</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Property Value</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Loan Balance</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Annual Contributions</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                  </div>
                </div>
                <p className="absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground font-medium">SMSF modelling is on the way</p>
              </div>

            </div>
          </section>
        ) : (
          <section>
            <div className="hidden lg:grid grid-cols-[1fr_1fr] gap-4 mb-4">
              <div className="gold-underline pb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Home size={26} strokeWidth={2.25} className="text-accent" />
                  Owner Occupied Property
                </h2>
              </div>
              <div className="gold-underline pb-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Landmark size={26} strokeWidth={2.25} className="text-accent" />
                  SMSF Property
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
              {/* Mobile-only heading above Add PPOR button */}
              <div className="gold-underline pb-2 lg:hidden">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Home size={26} strokeWidth={2.25} className="text-accent" />
                  Owner Occupied Property
                </h2>
              </div>
              <button
                onClick={addPpor}
                className="rounded-xl border-2 border-dashed border-border/40 p-4 flex items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-muted-foreground hover:text-accent"
              >
                <Plus size={18} />
                <span className="text-sm">Add Owner Occupied Property</span>
              </button>

              {/* Mobile-only heading above SMSF tile */}
              <div className="gold-underline pb-2 lg:hidden mt-2">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Landmark size={26} strokeWidth={2.25} className="text-accent" />
                  SMSF Property
                </h2>
              </div>
              {/* SMSF Tile — Coming Soon */}
              <div className="relative bg-card rounded-xl p-5 border-2 border-dashed border-border shadow-sm overflow-hidden">
                <div className="absolute top-3 right-3 z-10">
                  <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wide">Coming Soon</span>
                </div>
                <div className="opacity-40 pointer-events-none select-none">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Landmark size={16} className="text-accent shrink-0" />
                    <p className="font-semibold text-sm text-foreground">SMSF Property</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Fund Balance</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Property Value</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Loan Balance</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                    <div>
                      <label className="text-muted-foreground text-[11px] block mb-0.5">Annual Contributions</label>
                      <p className="text-foreground font-bold text-lg">$—</p>
                    </div>
                  </div>
                </div>
                <p className="absolute inset-x-0 bottom-3 text-center text-xs text-muted-foreground font-medium">SMSF modelling is on the way</p>
              </div>
            </div>
          </section>
        )}

        {/* Investment Properties */}
        <ExistingProperties
          properties={properties}
          setProperties={handleSetProperties}
          targetMonth={2}
          targetYear={2036}
          growthRate={6.5}
          portfolioMode
        />

        {/* PPOR Detail Sheet */}
        {ppor && (
          <PporDetailSheet
            open={pporSheetOpen}
            onOpenChange={(o) => {
              if (!o && ppor && !ppor.nickname && ppor.estimatedValue === 0) {
                removePpor();
              }
              setPporSheetOpen(o);
            }}
            ppor={ppor}
            setPpor={(p) => handleUpdatePpor(p)}
            suburb={pporSuburb}
            setSuburb={handleSetPporSuburb}
            loanBalance={ppor.loanBalance}
            setLoanBalance={(v) => handleUpdatePpor({ ...ppor, loanBalance: v })}
            interestRate={interestRate}
            pporValue={ppor.estimatedValue}
            setPporValue={(v) => handleUpdatePpor({ ...ppor, estimatedValue: v })}
          />
        )}
      </main>
    </div>
  );
};

export default Portfolio;
