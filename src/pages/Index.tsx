import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ArrowDownUp, Building2, Landmark, Wallet, TrendingUp } from "lucide-react";
import { defaultSaleCosts } from "@/types/property";
import Header from "@/components/Header";
import KeyInputs from "@/components/KeyInputs";
import ExistingProperties from "@/components/ExistingProperties";
import PropertiesToBuy from "@/components/PropertiesToBuy";
import PaydownSummary from "@/components/PaydownSummary";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";
import type { ExistingProperty, FutureProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

const Index = () => {
  const [loanBalance, setLoanBalance] = useState(1750000);
  const [interestRate, setInterestRate] = useState(6.2);
  const [targetMonth, setTargetMonth] = useState(2);
  const [targetYear, setTargetYear] = useState(2036);
  const [growthRate, setGrowthRate] = useState(6);
  const [pporSuburb, setPporSuburb] = useState("Bella Vista");
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>([
     { id: "1", nickname: "Parramatta", estimatedValue: 580000, loanBalance: 480000, earmarked: false, sellInYears: 0, ownership: "trust", investmentType: "unit", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails, purchasePrice: 200000 }, loanSplits: [{ id: "s1", label: "Parramatta loan", amount: 400000 }, { id: "s2", label: "Liverpool equity", amount: 80000 }] },
    { id: "2", nickname: "Liverpool", estimatedValue: 750000, loanBalance: 530000, earmarked: false, sellInYears: 0, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails } },
  ]);
  const [futureProperties, setFutureProperties] = useState<FutureProperty[]>([
    { id: "3", suburb: "Marsden Park", purchasePrice: 850000, rentalYield: 4.2, projectedEquity5yr: 530000, ownership: "trust", investmentType: "house", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 687 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 850000 } },
    { id: "4", suburb: "Hoppers Crossing", purchasePrice: 620000, rentalYield: 4.5, projectedEquity5yr: 385000, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails, weeklyRent: 536 }, purchase: { ...defaultPurchaseDetails, purchasePrice: 620000 } },
  ]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  // Sync properties to localStorage for cross-page access
  useEffect(() => {
    localStorage.setItem("portfolio-properties", JSON.stringify(existingProperties));
  }, [existingProperties]);
  const [clientName, setClientName] = useState("Client Name");

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
      .filter((p) => p.earmarked)
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

  const sellDownProceeds = useMemo(() => {
    return existingProperties
      .filter((p) => p.earmarked)
      .reduce((sum, p) => {
        const sc = p.saleCosts || { ...defaultSaleCosts };
        const sellYears = p.sellInYears || 0;
        const projectedValue = Math.round(p.estimatedValue * Math.pow(1 + growthRate / 100, sellYears));
        const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
        const proceeds = projectedValue - p.loanBalance - totalSelling;
        // Also subtract CGT
        const purchasePrice = p.purchase.purchasePrice || 0;
        const stampDutyAcq = sc.stampDutyOnPurchase || Math.round(purchasePrice * 0.05);
        const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
        const totalImprovements = sc.renovations + sc.structuralWork;
        const costBase = totalAcquisition + totalImprovements + sc.ownershipCostsTotal + totalSelling;
        const capitalGain = Math.max(0, projectedValue - costBase);
        const discountedGain = capitalGain * (1 - sc.cgtDiscount);
        const effectiveRate = sc.incomeTaxRate + 0.02;
        const cgtPayable = Math.round(discountedGain * effectiveRate);
        return sum + Math.max(0, proceeds - cgtPayable);
      }, 0);
  }, [existingProperties, growthRate]);

  return (
    <div className="min-h-screen bg-background">
      <Header clientName={clientName} setClientName={setClientName} />

      <main className="container mx-auto px-4 py-8 space-y-8">
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
        />

        <ExistingProperties
          properties={existingProperties}
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
          <span>Drag cards between sections to move them</span>
        </div>

        <PropertiesToBuy
          properties={futureProperties}
          setProperties={setFutureProperties}
          growthRate={growthRate}
          targetMonth={targetMonth}
          targetYear={targetYear}
          onMoveToPortfolio={(fp) => {
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

        {existingProperties.length > 0 && (
          <div>
            <div className="gold-underline pb-2 mb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <TrendingUp size={26} strokeWidth={2.25} className="text-accent" />
                Portfolio Summary
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: Building2, label: "Current portfolio value", value: `$${(2750000 + existingProperties.reduce((sum, p) => sum + p.estimatedValue, 0)).toLocaleString()}` },
                { icon: Landmark, label: "Total Loan amounts", value: `$${(loanBalance + existingProperties.reduce((sum, p) => sum + p.loanBalance, 0)).toLocaleString()}` },
                { icon: Wallet, label: "Portfolio Loan amount", value: `$${existingProperties.reduce((sum, p) => sum + p.loanBalance, 0).toLocaleString()}` },
                { icon: TrendingUp, label: "Current Equity", value: `$${(Math.max(0, (2750000 * 0.8) - loanBalance) + existingProperties.reduce((sum, p) => Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance) + sum, 0)).toLocaleString()}` },
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
