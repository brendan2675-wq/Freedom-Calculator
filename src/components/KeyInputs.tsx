import { useMemo } from "react";
import { DollarSign, CalendarClock, TrendingUp, Target, Wallet, Clock, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HouseProgress from "@/components/HouseProgress";
import PaydownChart from "@/components/PaydownChart";

interface KeyInputsProps {
  loanBalance: number;
  setLoanBalance: (v: number) => void;
  interestRate: number;
  setInterestRate: (v: number) => void;
  targetMonth: number;
  targetYear: number;
  setTargetMonth: (v: number) => void;
  setTargetYear: (v: number) => void;
  percentage: number;
  remaining: number;
  totalEquity: number;
  suburb: string;
  setSuburb: (v: string) => void;
  growthRate: number;
}

const KeyInputs = ({
  loanBalance, setLoanBalance, interestRate, setInterestRate,
  targetMonth, targetYear, setTargetMonth, setTargetYear,
  percentage, remaining, totalEquity, suburb, setSuburb, growthRate,
}: KeyInputsProps) => {
  const timeAway = useMemo(() => {
    const now = new Date();
    const target = new Date(targetYear, targetMonth - 1);
    let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return `${years} year${years !== 1 ? 's' : ''} and ${rem} month${rem !== 1 ? 's' : ''} away`;
  }, [targetMonth, targetYear]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 20 }, (_, i) => 2025 + i);

  const monthlyCost = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    if (monthlyRate <= 0) return 0;
    return Math.round(loanBalance * monthlyRate);
  }, [loanBalance, interestRate]);

  return (
    <TooltipProvider>
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
          The Target
        </h2>
        <div className="h-6" />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Loan, Target Date & Progress */}
          <div className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={18} className="text-accent" />
              <h3 className="text-lg font-semibold text-foreground">Loan to Pay Down</h3>
            </div>
            <p className="text-muted-foreground text-sm mb-3">Current PPOR loan balance & rate</p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={loanBalance.toLocaleString()}
                  onChange={(e) => {
                    const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                    setLoanBalance(v);
                  }}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all"
                />
              </div>
              <div className="relative w-28">
              <input
                  type="text"
                  inputMode="decimal"
                  value={interestRate}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                      setInterestRate(raw as any);
                    }
                  }}
                  onBlur={(e) => {
                    const v = parseFloat(e.target.value) || 0;
                    setInterestRate(v);
                  }}
                  className="w-full pl-3 pr-8 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all text-center"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-1">
                <CalendarClock size={18} className="text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Target Exit Date</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-3">When you want to be debt-free</p>
              <div className="flex gap-3 mb-3">
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(Number(e.target.value))}
                  className="flex-1 py-3 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
                <select
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-28 py-3 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-center"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <p className="text-accent font-medium text-sm">{timeAway}</p>
            </div>

            {/* Progress Tracker - moved here */}
            <div className="pt-4 mt-4 border-t border-border flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1 self-start">
                <TrendingUp size={18} className="text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Progress Tracker</h3>
              </div>
              <HouseProgress percentage={percentage} remaining={remaining} />
              <div className="w-full mt-3 pt-3 border-t border-border text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider">Equity Available</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={12} className="text-muted-foreground hover:text-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[200px]">
                      <p className="text-xs">Combined equity from existing properties marked for sell-down plus projected equity from future purchases.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-accent font-bold text-xl">${totalEquity.toLocaleString()}</p>
              </div>
              <input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                className="w-full text-center text-sm text-muted-foreground mt-2 bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none transition-colors"
                placeholder="Enter suburb"
              />
            </div>
          </div>

          {/* Card 2: Paydown Projection */}
          <div className="bg-card rounded-xl shadow-md p-0 border border-border flex flex-col overflow-hidden">
            <PaydownChart
              loanBalance={loanBalance}
              totalEquity={totalEquity}
              targetYear={targetYear}
              targetMonth={targetMonth}
              growthRate={growthRate}
            />
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default KeyInputs;
