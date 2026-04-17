import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { ArrowDownUp, Building2, Landmark, Wallet, TrendingUp } from "lucide-react";
import { defaultSaleCosts } from "@/types/property";
import { calculateStampDuty } from "@/lib/stampDuty";
import { decodeStateFromUrl } from "@/lib/scenarioManager";
import type { ScenarioState } from "@/lib/scenarioManager";
import Header from "@/components/Header";
import KeyInputs from "@/components/KeyInputs";
import ExistingProperties from "@/components/ExistingProperties";
import PropertiesToBuy from "@/components/PropertiesToBuy";
import SoldProperties from "@/components/SoldProperties";
import PaydownSummary from "@/components/PaydownSummary";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";
import type { ExistingProperty, FutureProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";
import { normalizeExistingProperties } from "@/lib/portfolioDefaults";

const Index = () => {
  const [clientName, setClientName] = useState(() => localStorage.getItem("client-name") || "Client Name");
  const handleSetClientName = (name: string) => {
    setClientName(name);
    localStorage.setItem("client-name", name);
  };
  const [interestRate, setInterestRate] = useState(6.2);
  const [targetMonth, setTargetMonth] = useState(2);
  const [targetYear, setTargetYear] = useState(2036);
  const [growthRate, setGrowthRate] = useState(6);
  const [pporSuburb, setPporSuburb] = useState("Bella Vista");

  // Shared PPOR state via localStorage
  const [ppor, setPpor] = useState<ExistingProperty>(() => {
    const stored = localStorage.getItem("portfolio-ppor");
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    const defaultPpor: ExistingProperty = {
      id: "ppor",
      nickname: "Owner Occupied",
      estimatedValue: 2750000,
      loanBalance: 1750000,
      earmarked: false,
      sellInYears: 0,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails },
      rental: { ...defaultRentalDetails },
      purchase: { ...defaultPurchaseDetails, purchasePrice: 2200000 },
    };
    localStorage.setItem("portfolio-ppor", JSON.stringify(defaultPpor));
    return defaultPpor;
  });

  const loanBalance = ppor.loanBalance;
  const setLoanBalance = (v: number) => {
    const updated = { ...ppor, loanBalance: v };
    setPpor(updated);
    localStorage.setItem("portfolio-ppor", JSON.stringify(updated));
  };
  const setPporValue = (v: number) => {
    const updated = { ...ppor, estimatedValue: v };
    setPpor(updated);
    localStorage.setItem("portfolio-ppor", JSON.stringify(updated));
  };
  const defaultExisting: ExistingProperty[] = [
    { id: "1", nickname: "Parramatta", estimatedValue: 580000, loanBalance: 480000, earmarked: false, sellInYears: 0, ownership: "trust", investmentType: "unit", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 480 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 200000 }, loanSplits: [{ id: "s1", label: "Parramatta loan", amount: 400000 }, { id: "s2", label: "Liverpool equity", amount: 80000 }] },
    { id: "2", nickname: "Liverpool", estimatedValue: 750000, loanBalance: 530000, earmarked: false, sellInYears: 0, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 550 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 530000 } },
  ];
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>(() => {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const { properties: normalized, changed } = normalizeExistingProperties(parsed);
        if (changed) {
          localStorage.setItem("portfolio-properties", JSON.stringify(normalized));
        }
        return normalized;
      } catch {}
    }
    localStorage.setItem("portfolio-properties", JSON.stringify(defaultExisting));
    return defaultExisting;
  });
  const defaultFuture: FutureProperty[] = [
    { id: "3", suburb: "Marsden Park", purchasePrice: 850000, rentalYield: 4.2, projectedEquity5yr: 530000, lvr: 80, ownership: "trust", investmentType: "house", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 687 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 850000 } },
    { id: "4", suburb: "Hoppers Crossing", purchasePrice: 620000, rentalYield: 4.5, projectedEquity5yr: 385000, lvr: 80, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 536 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 620000 } },
  ];
  const [futureProperties, setFutureProperties] = useState<FutureProperty[]>(() => {
    const stored = localStorage.getItem("portfolio-future-properties");
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    localStorage.setItem("portfolio-future-properties", JSON.stringify(defaultFuture));
    return defaultFuture;
  });
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Load scenario from URL on mount
  useEffect(() => {
    const imported = decodeStateFromUrl();
    if (imported) {
      setClientName(imported.clientName || "Client Name");
      setInterestRate(imported.interestRate);
      setTargetMonth(imported.targetMonth);
      setTargetYear(imported.targetYear);
      setGrowthRate(imported.growthRate);
      setPporSuburb(imported.pporSuburb);
      setPpor(imported.ppor);
      setExistingProperties(imported.existingProperties);
      setFutureProperties(imported.futureProperties);
      if (imported.pporStartingBalance) {
        localStorage.setItem("ppor-starting-balance", String(imported.pporStartingBalance));
      }
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
      toast.success("Scenario loaded from shared link");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentState = useCallback((): ScenarioState => ({
    clientName,
    interestRate,
    targetMonth,
    targetYear,
    growthRate,
    pporSuburb,
    ppor,
    existingProperties,
    futureProperties,
    pporStartingBalance: parseInt(localStorage.getItem("ppor-starting-balance") || "0", 10) || undefined,
  }), [clientName, interestRate, targetMonth, targetYear, growthRate, pporSuburb, ppor, existingProperties, futureProperties]);

  const loadScenarioState = useCallback((state: ScenarioState) => {
    setClientName(state.clientName || "Client Name");
    setInterestRate(state.interestRate);
    setTargetMonth(state.targetMonth);
    setTargetYear(state.targetYear);
    setGrowthRate(state.growthRate);
    setPporSuburb(state.pporSuburb);
    setPpor(state.ppor);
    setExistingProperties(state.existingProperties);
    setFutureProperties(state.futureProperties);
    localStorage.setItem("portfolio-ppor", JSON.stringify(state.ppor));
    localStorage.setItem("portfolio-properties", JSON.stringify(state.existingProperties));
    localStorage.setItem("portfolio-future-properties", JSON.stringify(state.futureProperties));
    localStorage.setItem("client-name", state.clientName || "Client Name");
    localStorage.setItem("ppor-suburb", state.pporSuburb || "");
    if (state.pporStartingBalance) {
      localStorage.setItem("ppor-starting-balance", String(state.pporStartingBalance));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync properties to localStorage for cross-page access
  useEffect(() => {
    const { properties: normalized, changed } = normalizeExistingProperties(existingProperties);
    if (changed) {
      setExistingProperties(normalized);
      return;
    }
    localStorage.setItem("portfolio-properties", JSON.stringify(normalized));
  }, [existingProperties]);

  useEffect(() => {
    localStorage.setItem("portfolio-future-properties", JSON.stringify(futureProperties));
  }, [futureProperties]);

  // Split existing properties into active and sold
  const now = new Date();
  const soldProperties = useMemo(() => {
    return existingProperties.filter((p) => {
      if (!p.earmarked || !p.purchase.settlementDate) return false;
      return new Date(p.purchase.settlementDate) <= now;
    });
  }, [existingProperties]);

  const activeProperties = useMemo(() => {
    const soldIds = new Set(soldProperties.map((p) => p.id));
    return existingProperties.filter((p) => !soldIds.has(p.id));
  }, [existingProperties, soldProperties]);

  useEffect(() => {
    const hasSeenDragHint = localStorage.getItem("drag-hint-seen");
    if (!hasSeenDragHint) {
      const timer = setTimeout(() => {
        toast("⚠️ Important: These projections are estimates only and do not constitute financial advice. Please consult a qualified financial adviser before making any investment decisions.", {
          duration: 8000,
        });
        setTimeout(() => {
          toast("💡 Tip: You can drag property cards between sections to move them", {
            duration: 5000,
          });
        }, 1500);
        localStorage.setItem("drag-hint-seen", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const calculations = useMemo(() => {
    const earmarkedEquity = existingProperties
      .filter((p) => p.earmarked && p.sellInYears === 0)
      .reduce((sum, p) => sum + Math.max(0, p.estimatedValue - p.loanBalance), 0);

    const futureEquity = futureProperties.reduce((sum, p) => sum + p.projectedEquity5yr, 0);

    const totalEquity = earmarkedEquity + futureEquity;
    const remaining = Math.max(0, loanBalance - totalEquity);
    const percentage = loanBalance > 0 ? ((loanBalance - remaining) / loanBalance) * 100 : 0;

    const now = new Date();
    const target = new Date(targetYear, targetMonth - 1);
    const yearsToGoal = Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));

    return { totalEquity, remaining, percentage, yearsToGoal };
  }, [loanBalance, existingProperties, futureProperties, targetMonth, targetYear]);

  const sellDownEvents = useMemo(() => {
    const now = new Date();
    return existingProperties
      .filter((p) => p.earmarked)
      .map((p) => {
        const sellYears = p.sellInYears || 0;
        const purchasePrice = p.purchase.purchasePrice || 0;
        const purchaseDateStr = p.purchase?.purchaseDate;
        const purchaseStart = purchaseDateStr ? new Date(purchaseDateStr) : null;
        const purchaseDelayYears = purchaseStart && purchaseStart > now
          ? (purchaseStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
          : 0;

        // Match sidebar's fractional sell years logic
        const target = new Date(targetYear, targetMonth - 1);
        const yearsToTarget = Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const fractionalYears = Math.abs(yearsToTarget - sellYears) < 0.5 ? yearsToTarget : sellYears;
        const effectiveGrowthYears = Math.max(0, fractionalYears - purchaseDelayYears);

        if (purchasePrice <= 0) {
          const proceeds = Math.max(0, p.estimatedValue - p.loanBalance);
          return { year: new Date().getFullYear() + sellYears, proceeds, nickname: p.nickname };
        }
        const rawSc = p.saleCosts || { ...defaultSaleCosts };
        const projectedValue = Math.round(p.estimatedValue * Math.pow(1 + growthRate / 100, effectiveGrowthYears));
        // Match sidebar: auto-default agent commission to 2% of projected value
        const sc = { ...rawSc, agentCommission: rawSc.agentCommission || Math.round(projectedValue * 0.02) };
        const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
        const proceeds = projectedValue - p.loanBalance - totalSelling;
        const autoStampDuty = p.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, p.state, p.purchase.purchaseDate || undefined) : 0;
        const stampDutyAcq = sc.stampDutyOnPurchase != null && sc.stampDutyOnPurchase > 0 ? sc.stampDutyOnPurchase : autoStampDuty;
        const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
        const totalImprovements = sc.renovations + sc.structuralWork;
        const costBase = totalAcquisition + totalImprovements + sc.ownershipCostsTotal + totalSelling;
        const capitalGain = Math.max(0, projectedValue - costBase);
        const losses = sc.capitalLosses || 0;
        const gainAfterLosses = Math.max(0, capitalGain - losses);
        const discountedGain = gainAfterLosses * (1 - sc.cgtDiscount);
        const effectiveRate = sc.incomeTaxRate;
        const cgtPayable = Math.round(discountedGain * effectiveRate);
        const netProceeds = Math.max(0, proceeds - cgtPayable);
        return { year: new Date().getFullYear() + sellYears, proceeds: netProceeds, nickname: p.nickname };
      });
  }, [existingProperties, growthRate, targetYear, targetMonth]);

  const sellDownProceeds = useMemo(() => {
    return sellDownEvents
      .filter((e) => e.year === new Date().getFullYear())
      .reduce((sum, e) => sum + e.proceeds, 0);
  }, [sellDownEvents]);

  return (
    <div className="min-h-screen bg-background">
      <Header clientName={clientName} setClientName={handleSetClientName} getCurrentState={getCurrentState} loadState={loadScenarioState} />

      <main className="container mx-auto px-4 py-8 space-y-8 pb-24">
        <KeyInputs
          loanBalance={loanBalance}
          setLoanBalance={setLoanBalance}
          interestRate={interestRate}
          setInterestRate={setInterestRate}
          targetMonth={targetMonth}
          targetYear={targetYear}
          setTargetMonth={setTargetMonth}
          setTargetYear={setTargetYear}
          percentage={calculations.percentage}
          remaining={calculations.remaining}
          totalEquity={calculations.totalEquity}
          suburb={pporSuburb}
          setSuburb={setPporSuburb}
          growthRate={growthRate}
          setGrowthRate={setGrowthRate}
           sellDownProceeds={sellDownProceeds}
           sellDownEvents={sellDownEvents}
           pporValue={ppor.estimatedValue}
           setPporValue={setPporValue}
           ppor={ppor}
           setPpor={(p) => {
             setPpor(p);
             localStorage.setItem("portfolio-ppor", JSON.stringify(p));
           }}
        />

        <ExistingProperties
          properties={activeProperties}
          setProperties={setExistingProperties}
          targetMonth={targetMonth}
          targetYear={targetYear}
          growthRate={growthRate}
          onMoveToProposals={(ep) => {
            const future: FutureProperty = {
              id: ep.id,
              suburb: ep.nickname,
              purchasePrice: ep.estimatedValue,
              rentalYield: 0,
              projectedEquity5yr: 0,
              lvr: 80,
              ownership: ep.ownership,
              investmentType: ep.investmentType,
              loan: { ...ep.loan },
              rental: { ...ep.rental },
              purchase: { ...ep.purchase },
            };
            setFutureProperties([...futureProperties, future]);
            setExistingProperties(existingProperties.filter((p) => p.id !== ep.id));
          }}
          onDropFromProposals={(id) => {
            const fp = futureProperties.find((p) => p.id === id);
            if (!fp) return;
            const existing: ExistingProperty = {
              id: fp.id,
              nickname: fp.suburb,
              estimatedValue: fp.purchasePrice,
              loanBalance: Math.round(fp.purchasePrice * 0.8),
              earmarked: false,
              sellInYears: 0,
              ownership: fp.ownership,
              investmentType: fp.investmentType,
              loan: { ...fp.loan },
              rental: { ...fp.rental },
              purchase: { ...fp.purchase },
            };
            setExistingProperties([...existingProperties, existing]);
            setFutureProperties(futureProperties.filter((p) => p.id !== id));
          }}
        />

        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm -my-4">
          <ArrowDownUp size={14} className="text-accent" />
          <span className="hidden sm:inline">Drag cards between sections to move them</span>
          <span className="sm:hidden">Hold & drag cards to move them</span>
        </div>

        <PropertiesToBuy
          properties={futureProperties}
          setProperties={setFutureProperties}
          growthRate={growthRate}
          targetMonth={targetMonth}
          targetYear={targetYear}
          onMoveToPortfolio={(fp) => {
            const purchaseDate = fp.purchase.purchaseDate || new Date().toISOString();
            const existing: ExistingProperty = {
              id: fp.id,
              nickname: fp.suburb,
              estimatedValue: fp.purchasePrice,
              loanBalance: Math.round(fp.purchasePrice * 0.8),
              earmarked: false,
              sellInYears: 0,
              ownership: fp.ownership,
              investmentType: fp.investmentType,
              loan: { ...fp.loan },
              rental: { ...fp.rental },
              purchase: { ...fp.purchase, purchaseDate },
            };
            setExistingProperties([...existingProperties, existing]);
            setFutureProperties(futureProperties.filter((p) => p.id !== fp.id));
          }}
          onDropFromPortfolio={(id) => {
            const ep = existingProperties.find((p) => p.id === id);
            if (!ep) return;
            const future: FutureProperty = {
              id: ep.id,
              suburb: ep.nickname,
              purchasePrice: ep.estimatedValue,
              rentalYield: 0,
              projectedEquity5yr: 0,
              lvr: 80,
              ownership: ep.ownership,
              investmentType: ep.investmentType,
              loan: { ...ep.loan },
              rental: { ...ep.rental },
              purchase: { ...ep.purchase },
            };
            setFutureProperties([...futureProperties, future]);
            setExistingProperties(existingProperties.filter((p) => p.id !== id));
          }}
        />

        <SoldProperties
          properties={soldProperties}
          onUpdate={(updated) => {
            setExistingProperties(existingProperties.map((p) => p.id === updated.id ? updated : p));
          }}
          growthRate={growthRate}
        />


        {activeProperties.length > 0 && (
          <div>
            <div className="gold-underline pb-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <TrendingUp size={26} strokeWidth={2.25} className="text-accent" />
                Portfolio Summary
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Building2, label: "Current portfolio value", value: `$${(ppor.estimatedValue + activeProperties.reduce((sum, p) => sum + p.estimatedValue, 0)).toLocaleString()}` },
                { icon: Landmark, label: "Total Loan amounts", value: `$${(loanBalance + activeProperties.reduce((sum, p) => sum + p.loanBalance, 0)).toLocaleString()}` },
                { icon: Wallet, label: "Portfolio Loan amount", value: `$${activeProperties.reduce((sum, p) => sum + p.loanBalance, 0).toLocaleString()}` },
                { icon: TrendingUp, label: "Current Equity", value: `$${(Math.max(0, (ppor.estimatedValue * 0.8) - loanBalance) + activeProperties.reduce((sum, p) => Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance) + sum, 0)).toLocaleString()}` },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl p-4 border border-border shadow-sm flex flex-col items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <stat.icon size={18} className="text-accent" />
                  </div>
                  <p className="text-muted-foreground text-xs font-medium text-center">{stat.label}</p>
                  <p className="text-accent text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default Index;
