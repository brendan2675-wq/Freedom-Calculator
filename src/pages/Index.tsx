import { useState, useMemo } from "react";
import Header from "@/components/Header";
import KeyInputs from "@/components/KeyInputs";
import HouseProgress from "@/components/HouseProgress";
import ExistingProperties, { ExistingProperty } from "@/components/ExistingProperties";
import PropertiesToBuy, { FutureProperty } from "@/components/PropertiesToBuy";
import PaydownSummary from "@/components/PaydownSummary";
import Disclaimer from "@/components/Disclaimer";
import Footer from "@/components/Footer";

const Index = () => {
  const [loanBalance, setLoanBalance] = useState(650000);
  const [targetMonth, setTargetMonth] = useState(2);
  const [targetYear, setTargetYear] = useState(2030);
  const [growthRate, setGrowthRate] = useState(7);
  const [existingProperties, setExistingProperties] = useState<ExistingProperty[]>([]);
  const [futureProperties, setFutureProperties] = useState<FutureProperty[]>([]);
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
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <KeyInputs
          loanBalance={loanBalance}
          setLoanBalance={setLoanBalance}
          targetMonth={targetMonth}
          targetYear={targetYear}
          setTargetMonth={setTargetMonth}
          setTargetYear={setTargetYear}
          growthRate={growthRate}
          setGrowthRate={setGrowthRate}
        />

        <HouseProgress
          percentage={calculations.percentage}
          remaining={calculations.remaining}
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

        <Disclaimer
          accepted={disclaimerAccepted}
          setAccepted={setDisclaimerAccepted}
        />
      </main>

      <Footer />

      <PaydownSummary
        totalEquity={calculations.totalEquity}
        loanRemaining={calculations.remaining}
        yearsToGoal={calculations.yearsToGoal}
        blurred={!disclaimerAccepted}
      />
    </div>
  );
};

export default Index;
