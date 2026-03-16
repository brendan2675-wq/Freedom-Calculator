import { useMemo, useState } from "react";
import { DollarSign, CalendarClock, TrendingUp, Target, Wallet, Clock, Info, AlertTriangle, Home, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  setGrowthRate: (v: number) => void;
  sellDownProceeds: number;
}

const KeyInputs = ({
  loanBalance, setLoanBalance, interestRate, setInterestRate,
  targetMonth, targetYear, setTargetMonth, setTargetYear,
  percentage, remaining, totalEquity, suburb, setSuburb, growthRate, setGrowthRate, sellDownProceeds,
}: KeyInputsProps) => {
  const [lvrRate, setLvrRate] = useState(0.8);
  const [startingBalance, setStartingBalance] = useState(1842105);
  const [pporInterestRate, setPporInterestRate] = useState(6.2);
  const [repaymentType, setRepaymentType] = useState<"pi" | "io">("pi");
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [loanTermMonths, setLoanTermMonths] = useState(0);
  const [ioPeriodYears, setIoPeriodYears] = useState(5);
  const [trackerOpen, setTrackerOpen] = useState(false);

  const adjustedBalance = useMemo(() => Math.max(0, startingBalance - sellDownProceeds), [startingBalance, sellDownProceeds]);

  const paydownPercent = useMemo(() => {
    if (adjustedBalance <= 0) return 100;
    if (loanBalance >= adjustedBalance) return 0;
    return ((adjustedBalance - loanBalance) / adjustedBalance) * 100;
  }, [adjustedBalance, loanBalance]);
  const pporValue = 2750000;
  const equityAvailable = useMemo(() => Math.max(0, (pporValue * lvrRate) - loanBalance), [pporValue, lvrRate, loanBalance]);
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
          The Goal
        </h2>
        <div className="h-6" />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Loan, Target Date & Progress */}
          <div className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col justify-between">
            {/* Loan to Pay Down */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={18} className="text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Loan to Pay Down</h3>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-muted-foreground text-sm">Current PPOR loan balance & rate</p>
                <span className="inline-flex items-center gap-1 text-[10px] text-destructive font-medium bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                  <AlertTriangle size={10} className="text-destructive" />
                  Update
                </span>
              </div>
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
            </div>

            {/* Progress Tracker - clickable to open sheet */}
            <div
              className="pt-5 mt-5 border-t border-border cursor-pointer group"
              onClick={() => setTrackerOpen(true)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Progress Tracker</h3>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
                <span className="text-success font-bold text-lg">{paydownPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-8 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, paydownPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>${adjustedBalance.toLocaleString()}{sellDownProceeds > 0 && <span className="text-success"> (−${sellDownProceeds.toLocaleString()} sell down)</span>}</span>
                <span className="font-semibold text-foreground">${loanBalance.toLocaleString()} remaining</span>
                <span>$0</span>
              </div>
            </div>

            {/* Progress Tracker Sheet */}
            <Sheet open={trackerOpen} onOpenChange={setTrackerOpen}>
              <SheetContent className="overflow-y-auto">
                <SheetHeader className="pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-accent" />
                    <SheetTitle className="text-xl">Progress Tracker</SheetTitle>
                  </div>
                </SheetHeader>

                <div className="space-y-6 pt-6">
                  {/* Paydown visual */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Paydown Progress</span>
                      <span className="text-success font-bold text-2xl">{paydownPercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-6 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-success rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, paydownPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>${adjustedBalance.toLocaleString()}</span>
                      <span>${loanBalance.toLocaleString()} remaining</span>
                      <span>$0</span>
                    </div>
                    {sellDownProceeds > 0 && (
                      <p className="text-xs text-success mt-1">Sell-down proceeds applied: −${sellDownProceeds.toLocaleString()}</p>
                    )}
                  </div>

                  {/* Starting Balance */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Starting Loan Balance</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={startingBalance.toLocaleString()}
                        onChange={(e) => {
                          const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                          setStartingBalance(v);
                        }}
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Interest Rate</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pporInterestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || /^\d*\.?\d*$/.test(raw)) setPporInterestRate(raw as any);
                        }}
                        onBlur={(e) => setPporInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-full pl-4 pr-8 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent transition-all text-center"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                    </div>
                  </div>

                  {/* Repayment Type */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Repayment Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setRepaymentType("pi")}
                        className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                          repaymentType === "pi"
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background text-muted-foreground hover:border-accent/50"
                        }`}
                      >
                        Principal & Interest
                      </button>
                      <button
                        onClick={() => setRepaymentType("io")}
                        className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                          repaymentType === "io"
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-background text-muted-foreground hover:border-accent/50"
                        }`}
                      >
                        Interest Only
                      </button>
                    </div>
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Loan Term</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Years</label>
                        <input
                          type="number"
                          min={1} max={40}
                          value={loanTermYears}
                          onChange={(e) => setLoanTermYears(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent text-center"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Months</label>
                        <input
                          type="number"
                          min={0} max={11}
                          value={loanTermMonths}
                          onChange={(e) => setLoanTermMonths(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* IO Period - only when Interest Only selected */}
                  {repaymentType === "io" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Interest-Only Period</label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0} max={15}
                          value={ioPeriodYears}
                          onChange={(e) => setIoPeriodYears(parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent text-center"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">years</span>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Equity Pull */}
            <div className="pt-5 mt-5 border-t border-border">
              <div className="grid grid-cols-2 gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">{suburb}</h3>
                  <button className="text-[9px] leading-tight text-accent font-medium bg-accent/10 px-2.5 py-1 rounded hover:bg-accent/20 transition-colors w-20 text-center">
                    Request property report
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-accent" />
                  <span className="text-lg font-semibold text-foreground">Equity Pull</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground text-xs font-medium mb-1 block">Current Value</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={(2750000).toLocaleString()}
                      readOnly
                      className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <label className="text-muted-foreground text-xs font-medium">Equity Available</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={12} className="text-muted-foreground hover:text-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        <p className="text-xs">(Current Value × LVR) − Loan Balance</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                    <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input
                        type="text"
                        value={equityAvailable.toLocaleString()}
                        readOnly
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-accent text-lg font-bold focus:outline-none transition-all"
                      />
                    </div>
                    {equityAvailable > 150000 && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-success/15 text-success border border-success/30 whitespace-nowrap">
                        Go again
                      </span>
                    )}
                    <select
                      value={lvrRate}
                      onChange={(e) => setLvrRate(Number(e.target.value))}
                      className="w-24 py-3 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value={0.8}>80% LVR</option>
                      <option value={0.88}>88% LVR</option>
                      <option value={0.9}>90% LVR</option>
                      <option value={0.95}>95% LVR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Paydown Projection */}
          <div className="bg-card rounded-xl shadow-md p-0 border border-border flex flex-col overflow-hidden">
            <PaydownChart
              loanBalance={loanBalance}
              totalEquity={totalEquity}
              targetYear={targetYear}
              targetMonth={targetMonth}
              setTargetMonth={setTargetMonth}
              setTargetYear={setTargetYear}
              growthRate={growthRate}
              setGrowthRate={setGrowthRate}
              interestRate={interestRate}
            />
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
};

export default KeyInputs;
