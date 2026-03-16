import { useState, useMemo } from "react";
import { defaultSaleCosts } from "@/types/property";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
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
     { id: "1", nickname: "Parramatta", estimatedValue: 580000, loanBalance: 480000, earmarked: false, ownership: "trust", investmentType: "unit", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails, purchasePrice: 200000 }, loanSplits: [{ id: "s1", label: "Parramatta loan", amount: 400000 }, { id: "s2", label: "Liverpool equity", amount: 80000 }] },
    { id: "2", nickname: "Liverpool", estimatedValue: 750000, loanBalance: 530000, earmarked: false, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails } },
  ]);
  const [futureProperties, setFutureProperties] = useState<FutureProperty[]>([
    { id: "3", suburb: "Marsden Park", purchasePrice: 850000, rentalYield: 4.2, projectedEquity5yr: 530000, ownership: "trust", investmentType: "house", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails, purchasePrice: 850000 } },
    { id: "4", suburb: "Hoppers Crossing", purchasePrice: 620000, rentalYield: 4.5, projectedEquity5yr: 385000, ownership: "personal", investmentType: "townhouse", loan: { ...defaultLoanDetails }, rental: { ...defaultRentalDetails }, purchase: { ...defaultPurchaseDetails, purchasePrice: 620000 } },
  ]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [clientName, setClientName] = useState("Client Name");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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
        const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
        const proceeds = p.estimatedValue - p.loanBalance - totalSelling;
        const purchasePrice = p.purchase.purchasePrice || 0;
        const stampDutyAcq = sc.stampDutyOnPurchase || Math.round(purchasePrice * 0.05);
        const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
        const totalImprovements = sc.renovations + sc.structuralWork;
        const costBase = totalAcquisition + totalImprovements + sc.ownershipCostsTotal + totalSelling;
        const capitalGain = Math.max(0, p.estimatedValue - costBase);
        const discountedGain = capitalGain * (1 - sc.cgtDiscount);
        const effectiveRate = sc.incomeTaxRate + 0.02;
        const cgtPayable = Math.round(discountedGain * effectiveRate);
        return sum + Math.max(0, proceeds - cgtPayable);
      }, 0);
  }, [existingProperties]);

  const moveToPortfolio = (fp: FutureProperty) => {
    const existing: ExistingProperty = {
      id: fp.id,
      nickname: fp.suburb,
      estimatedValue: fp.purchasePrice,
      loanBalance: Math.round(fp.purchasePrice * 0.8),
      earmarked: false,
      ownership: fp.ownership,
      investmentType: fp.investmentType,
      loan: { ...fp.loan },
      rental: { ...fp.rental },
      purchase: { ...fp.purchase },
    };
    setExistingProperties((prev) => [...prev, existing]);
    setFutureProperties((prev) => prev.filter((p) => p.id !== fp.id));
  };

  const moveToProposals = (ep: ExistingProperty) => {
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
    setFutureProperties((prev) => [...prev, future]);
    setExistingProperties((prev) => prev.filter((p) => p.id !== ep.id));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const dragId = active.id as string;
    const dropZone = over.id as string;

    // Dragging from proposals → portfolio
    if (dropZone === "portfolio-drop") {
      const fp = futureProperties.find((p) => p.id === dragId);
      if (fp) moveToPortfolio(fp);
    }

    // Dragging from portfolio → proposals
    if (dropZone === "proposals-drop") {
      const ep = existingProperties.find((p) => p.id === dragId);
      if (ep) moveToProposals(ep);
    }
  };

  // Find the dragged item for overlay
  const draggedExisting = activeDragId ? existingProperties.find((p) => p.id === activeDragId) : null;
  const draggedFuture = activeDragId ? futureProperties.find((p) => p.id === activeDragId) : null;
  const dragLabel = draggedExisting?.nickname || draggedFuture?.suburb || "";

  return (
    <div className="min-h-screen bg-background">
      <Header clientName={clientName} setClientName={setClientName} />

      <main className="container mx-auto px-4 py-8 space-y-12">
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

        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <ExistingProperties
            properties={existingProperties}
            setProperties={setExistingProperties}
            targetMonth={targetMonth}
            targetYear={targetYear}
            growthRate={growthRate}
            onMoveToProposals={moveToProposals}
            droppableId="portfolio-drop"
            isDropTarget={!!draggedFuture}
          />

          <PropertiesToBuy
            properties={futureProperties}
            setProperties={setFutureProperties}
            growthRate={growthRate}
            targetMonth={targetMonth}
            targetYear={targetYear}
            pporLoanBalance={loanBalance}
            portfolioLoanTotal={existingProperties.reduce((sum, p) => sum + p.loanBalance, 0)}
            currentPortfolioValue={2750000 + existingProperties.reduce((sum, p) => sum + p.estimatedValue, 0)}
            currentEquity={
              Math.max(0, (2750000 * 0.8) - loanBalance) +
              existingProperties.reduce((sum, p) => Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance) + sum, 0)
            }
            onMoveToPortfolio={moveToPortfolio}
            droppableId="proposals-drop"
            isDropTarget={!!draggedExisting}
          />

          <DragOverlay>
            {activeDragId && dragLabel ? (
              <div className="bg-card rounded-xl shadow-2xl p-4 border-2 border-accent opacity-90 min-w-[200px]">
                <p className="font-semibold text-sm text-foreground">{dragLabel}</p>
                <p className="text-xs text-muted-foreground mt-1">Drop to move</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <Disclaimer
          accepted={disclaimerAccepted}
          setAccepted={setDisclaimerAccepted}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
