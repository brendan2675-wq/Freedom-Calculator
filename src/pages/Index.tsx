import { useState, useMemo } from "react";
import Header from "@/components/Header";
import KeyInputs from "@/components/KeyInputs";
import ExistingProperties, { ExistingProperty } from "@/components/ExistingProperties";
import PropertiesToBuy, { FutureProperty } from "@/components/PropertiesToBuy";
import PaydownChart from "@/components/PaydownChart";
import PaydownSummary from "@/components/PaydownSummary";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";

const Index = () => {
  const [loanBalance, setLoanBalance] = useState(2000000);
  const [targetMonth, setTargetMonth] = useState(2);
  const [targetYear, setTargetYear] = useState(2036);
  const [growthRate, setGrowthRate] = useState(7);
  const [pporSuburb, setPporSuburb] = useState("Bella Vista");
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>([
    { id: "1", nickname: "Parramatta Unit", estimatedValue: 620000, loanBalance: 480000, earmarked: true, ownership: "trust" as const },
    { id: "2", nickname: "Liverpool Townhouse", estimatedValue: 750000, loanBalance: 630000, earmarked: true, ownership: "personal" as const },
  ]);
  const [futureProperties, setFutureProperties] = useState<FutureProperty[]>([
    { id: "3", suburb: "Investment property purchase 1", purchasePrice: 850000, rentalYield: 4.2, projectedEquity5yr: 277585, ownership: "trust" as const },
  ]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <KeyInputs
          loanBalance={loanBalance}
          setLoanBalance={setLoanBalance}
          targetMonth={targetMonth}
          targetYear={targetYear}
          setTargetMonth={setTargetMonth}
          setTargetYear={setTargetYear}
          percentage={calculations.percentage}
          remaining={calculations.remaining}
          totalEquity={calculations.totalEquity}
          suburb={pporSuburb}
          setSuburb={setPporSuburb}
        />

        <ExistingProperties
          properties={existingProperties}
          setProperties={setExistingProperties}
        />

        <PropertiesToBuy
          properties={futureProperties}
          setProperties={setFutureProperties}
          growthRate={growthRate}
        />

        <PaydownChart
          loanBalance={loanBalance}
          totalEquity={calculations.totalEquity}
          targetYear={targetYear}
          targetMonth={targetMonth}
          growthRate={growthRate}
        />

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
