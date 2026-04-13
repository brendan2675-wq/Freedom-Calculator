import { useMemo, useState, useEffect } from "react";
import { DollarSign, CalendarClock, TrendingUp, Target, Wallet, Clock, Info, Home, ChevronRight, ArrowDown, ChevronDown, Plus, X } from "lucide-react";
import type { ExistingProperty, LoanSplit } from "@/types/property";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import HouseProgress from "@/components/HouseProgress";
import PaydownChart from "@/components/PaydownChart";

export interface SellDownEvent {
  year: number;
  proceeds: number;
  nickname: string;
}

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
  sellDownEvents: SellDownEvent[];
  pporValue: number;
  setPporValue: (v: number) => void;
  ppor: ExistingProperty;
  setPpor: (p: ExistingProperty) => void;
}

const KeyInputs = ({
  loanBalance, setLoanBalance, interestRate, setInterestRate,
  targetMonth, targetYear, setTargetMonth, setTargetYear,
  percentage, remaining, totalEquity, suburb, setSuburb, growthRate, setGrowthRate, sellDownProceeds, sellDownEvents, pporValue, setPporValue, ppor, setPpor,
}: KeyInputsProps) => {
  const [lvrRate, setLvrRate] = useState(0.8);
  const [startingBalance, setStartingBalanceState] = useState(() => {
    const stored = localStorage.getItem("ppor-starting-balance");
    return stored ? parseInt(stored, 10) : 1842105;
  });
  const setStartingBalance = (v: number) => {
    setStartingBalanceState(v);
    localStorage.setItem("ppor-starting-balance", String(v));
  };
  
  const [repaymentType, setRepaymentType] = useState<"pi" | "io">("pi");
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [loanTermMonths, setLoanTermMonths] = useState(0);
  const [ioPeriodYears, setIoPeriodYears] = useState(5);
  const [pporSheetOpen, setPporSheetOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(2200000);
  const [pporDetailOpen, setPporDetailOpen] = useState(false);

  const currentValue = pporValue || 2750000;
  const growthPercent = useMemo(() => {
    if (purchasePrice <= 0) return 0;
    return ((currentValue - purchasePrice) / purchasePrice) * 100;
  }, [currentValue, purchasePrice]);

  const adjustedRemaining = useMemo(() => Math.max(0, loanBalance - sellDownProceeds), [loanBalance, sellDownProceeds]);

  const paydownPercent = useMemo(() => {
    if (startingBalance <= 0) return 0;
    return ((startingBalance - adjustedRemaining) / startingBalance) * 100;
  }, [startingBalance, adjustedRemaining]);
  
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


  // Sell-down bridge summary (improvement #4)
  const earmarkedCount = sellDownEvents.length;
  const totalSellDownProceeds = useMemo(() => sellDownEvents.reduce((sum, e) => sum + e.proceeds, 0), [sellDownEvents]);
  const [sellDownOpen, setSellDownOpen] = useState(false);

  return (
    <TooltipProvider>
      <section>
        <div className="gold-underline pb-2 mb-1">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Target size={26} strokeWidth={2.25} className="text-accent" />
            The Goal
          </h2>
        </div>
        <div className="h-6" />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Loan, Target Date & Progress */}
          <div
            className="bg-card rounded-xl shadow-md p-6 border border-border flex flex-col justify-between cursor-pointer hover:shadow-lg hover:border-accent/30 transition-all"
            onClick={() => setPporSheetOpen(true)}
          >
            {/* Loan to Pay Down */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={18} className="text-accent" />
                <h3 className="text-lg font-semibold text-foreground">Loan to Pay Down</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-3">Current PPOR loan balance & rate</p>
              <div className="flex gap-3">
                <div className="relative flex-1 py-3 px-4 rounded-lg border border-border bg-muted/30">
                  <span className="text-muted-foreground text-xs">Balance</span>
                  <p className="text-lg font-bold text-foreground">${loanBalance.toLocaleString()}</p>
                </div>
                <div className="relative w-28 py-3 px-4 rounded-lg border border-border bg-muted/30 text-center">
                  <span className="text-muted-foreground text-xs">Rate</span>
                  <p className="text-lg font-bold text-foreground">{interestRate}%</p>
                </div>
              </div>
              {sellDownProceeds > 0 && (
                <div className="mt-3 rounded-lg bg-success/5 border border-success/20 px-4 py-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Current Loan</span>
                    <span className="font-medium text-foreground">${loanBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-success mt-1">
                    <span>Sell-Down Proceeds</span>
                    <span className="font-medium">− ${sellDownProceeds.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-success/20 mt-2 pt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Net Balance</span>
                    <span className="text-lg font-bold text-success">${adjustedRemaining.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Tracker */}
            <div className="pt-5 mt-5 border-t border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Progress Tracker</h3>
                </div>
                <span className="font-bold text-lg" style={{ color: `hsl(${Math.round((Math.min(100, paydownPercent) / 100) * 80 + 25)}, 80%, 45%)` }}>{paydownPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-8 rounded-full bg-secondary overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{
                    width: `${Math.min(100, paydownPercent)}%`,
                    background: `linear-gradient(90deg, hsl(25, 80%, 50%) 0%, hsl(${Math.round((Math.min(100, paydownPercent) / 100) * 80 + 25)}, 80%, 45%) 100%)`,
                    boxShadow: `0 0 12px hsl(${Math.round((Math.min(100, paydownPercent) / 100) * 80 + 25)}, 80%, 45%, 0.3)`,
                  }}
                >
                  <div className="absolute inset-0 opacity-15" style={{ background: 'linear-gradient(180deg, white 0%, transparent 60%)' }} />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>${startingBalance.toLocaleString()}</span>
                <span className="font-semibold text-foreground">${adjustedRemaining.toLocaleString()} remaining{sellDownProceeds > 0 && <span className="text-success"> (−${sellDownProceeds.toLocaleString()} sell down)</span>}</span>
                <span>$0</span>
              </div>
            </div>

            {/* PPOR & Equity */}
            <div className="pt-5 mt-5 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                {/* Property Value Card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Home size={16} className="text-accent" />
                    <span className="text-sm font-semibold text-foreground">{suburb}</span>
                    <button
                      className="text-[10px] text-accent font-medium bg-accent/10 px-2 py-0.5 rounded hover:bg-accent/20 transition-colors whitespace-nowrap ml-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Request property report
                    </button>
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">Current Value</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-foreground">${currentValue.toLocaleString()}</p>
                    {purchasePrice > 0 && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        growthPercent >= 0
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}>
                        {growthPercent >= 0 ? "↑" : "↓"}{Math.abs(growthPercent).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Equity Available Card */}
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet size={16} className="text-accent" />
                    <span className="text-sm font-semibold text-foreground">Equity Available</span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-2">Equity Available</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-2xl font-bold ${equityAvailable > 50000 ? 'text-success' : 'text-accent'}`}>${equityAvailable.toLocaleString()}</p>
                    <select
                      value={lvrRate}
                      onChange={(e) => { e.stopPropagation(); setLvrRate(Number(e.target.value)); }}
                      onClick={(e) => e.stopPropagation()}
                      className="py-1.5 px-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <option value={0.8}>80% LVR</option>
                      <option value={0.88}>88% LVR</option>
                      <option value={0.9}>90% LVR</option>
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
              sellDownEvents={sellDownEvents}
              repaymentType={repaymentType}
              loanTermYears={loanTermYears}
              loanTermMonths={loanTermMonths}
              ioPeriodYears={ioPeriodYears}
            />
          </div>
        </div>

        {/* Sell-Down Bridge (improvement #4) */}
        {earmarkedCount > 0 && (
          <div className="py-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <button
                onClick={() => setSellDownOpen(!sellDownOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/60 border border-border rounded-full px-4 py-2 hover:bg-secondary transition-colors cursor-pointer"
              >
                <ArrowDown size={14} className="text-accent" />
                <span>
                  <span className="font-semibold text-foreground">{earmarkedCount}</span> {earmarkedCount === 1 ? 'property' : 'properties'} earmarked
                  <span className="mx-1.5">→</span>
                  <span className="font-semibold text-success">${totalSellDownProceeds.toLocaleString()}</span> net proceeds
                </span>
                <ChevronDown size={14} className={`text-accent transition-transform ${sellDownOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className="h-px flex-1 bg-border" />
            </div>

            {sellDownOpen && (
              <div className="mt-3 mx-auto max-w-lg bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                {sellDownEvents.map((event, i) => {
                  const percentage = totalSellDownProceeds > 0 ? (event.proceeds / totalSellDownProceeds) * 100 : 0;
                  return (
                    <div
                      key={`${event.nickname}-${i}`}
                      className={`flex items-center justify-between px-4 py-3 text-sm ${i > 0 ? 'border-t border-border/60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                        <span className="font-medium text-foreground">{event.nickname}</span>
                        <span className="text-muted-foreground text-xs">
                          {event.year === new Date().getFullYear() ? 'Selling now' : `Selling ${event.year}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, percentage)}%` }} />
                        </div>
                        <span className={`font-semibold tabular-nums ${event.proceeds >= 0 ? 'text-success' : 'text-destructive'}`}>
                          ${event.proceeds.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30 text-sm font-semibold">
                  <span className="text-foreground">Total Net Proceeds</span>
                  <span className="text-success">${totalSellDownProceeds.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Comprehensive PPOR Sheet */}
        <Sheet open={pporDetailOpen || pporSheetOpen} onOpenChange={(o) => { setPporDetailOpen(o); setPporSheetOpen(o); }}>
          <SheetContent className="overflow-y-auto">
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Home size={20} className="text-accent" />
                <SheetTitle className="text-xl">Your Home (PPOR)</SheetTitle>
              </div>
            </SheetHeader>

            <div className="space-y-8 pt-6">
              {/* Section 1: Property Details */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Property Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Suburb</label>
                    <input
                      type="text"
                      value={suburb}
                      onChange={(e) => setSuburb(e.target.value)}
                      placeholder="e.g. Paddington"
                      className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Section 2: Loan Details */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Loan Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Current Loan Balance</label>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={loanBalance ? loanBalance.toLocaleString() : ""}
                        onChange={(e) => setLoanBalance(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                    </div>
                  </div>

                  {/* Loan Splits */}
                  <div className="pl-2 border-l-2 border-accent/20 space-y-2 [&_input]:py-1 [&_input]:px-1 [&_input]:text-[10px] [&_input]:rounded [&_input]:rounded-lg-none">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground font-medium">Loan Splits</label>
                      <button
                        onClick={() => {
                          const splits = ppor.loanSplits || [];
                          const newSplit: LoanSplit = { id: crypto.randomUUID(), label: `Split ${splits.length + 1}`, amount: 0 };
                          setPpor({ ...ppor, loanSplits: [...splits, newSplit] });
                        }}
                        className="text-accent hover:text-accent/80 transition-colors p-0.5"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {(ppor.loanSplits || []).length > 0 && (
                      <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-medium">
                        <span className="flex-[2] min-w-0">Label</span>
                        <span className="flex-[2] min-w-0">Amt ($)</span>
                        <span className="flex-[1.2] min-w-0">Rate (%)</span>
                        <span className="flex-[1] min-w-0">IO</span>
                        <span className="flex-[1.2] min-w-0">Term (yr)</span>
                        <span className="flex-[2] min-w-0">Offset ($)</span>
                        <span className="w-4" />
                      </div>
                    )}
                    {(ppor.loanSplits || []).map((split, idx) => {
                      const updateSplit = (patch: Partial<LoanSplit>, recalcTotal = false) => {
                        const splits = [...(ppor.loanSplits || [])];
                        splits[idx] = { ...splits[idx], ...patch };
                        const updated: Partial<ExistingProperty> = { loanSplits: splits };
                        if (recalcTotal) {
                          const total = splits.reduce((s, sp) => s + sp.amount, 0);
                          updated.loanBalance = total;
                          setLoanBalance(total);
                        }
                        setPpor({ ...ppor, ...updated });
                      };
                      return (
                        <div key={split.id} className="flex items-center gap-1">
                          <input
                            value={split.label}
                            onChange={(e) => updateSplit({ label: e.target.value })}
                            className="flex-[2] min-w-0 py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                            placeholder="Label"
                          />
                          <div className="flex-[2] min-w-0">
                            <input
                              inputMode="numeric"
                              value={split.amount || ""}
                              onChange={(e) => updateSplit({ amount: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 }, true)}
                              className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                              placeholder="0"
                            />
                          </div>
                          <div className="flex-[1.2] min-w-0">
                            <input
                              inputMode="decimal"
                              value={split.interestRate ?? interestRate}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '' || /^\d*\.?\d*$/.test(raw)) updateSplit({ interestRate: parseFloat(raw) || 0 });
                              }}
                              className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div className="flex-[1] min-w-0">
                            <input
                              type="number"
                              min={0}
                              value={split.interestOnlyPeriodYears ?? 0}
                              onChange={(e) => updateSplit({ interestOnlyPeriodYears: parseInt(e.target.value) || 0 })}
                              className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div className="flex-[1.2] min-w-0">
                            <input
                              type="number"
                              min={1}
                              value={split.loanTermYears ?? 30}
                              onChange={(e) => updateSplit({ loanTermYears: parseInt(e.target.value) || 0 })}
                              className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <div className="flex-[2] min-w-0">
                            <input
                              inputMode="numeric"
                              value={split.offsetBalance ?? 0}
                              onChange={(e) => updateSplit({ offsetBalance: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                              className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const splits = (ppor.loanSplits || []).filter((_, i) => i !== idx);
                              const total = splits.reduce((s, sp) => s + sp.amount, 0);
                              setLoanBalance(total);
                              setPpor({ ...ppor, loanSplits: splits, loanBalance: total });
                            }}
                            className="w-4 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                    {(ppor.loanSplits || []).length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">${(ppor.loanSplits || []).reduce((s, sp) => s + sp.amount, 0).toLocaleString()}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Interest Rate</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={interestRate}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '' || /^\d*\.?\d*$/.test(raw)) setInterestRate(raw as any);
                        }}
                        onBlur={(e) => setInterestRate(parseFloat(e.target.value) || 0)}
                        className="w-full py-2 px-3 pr-8 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm text-center"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Section 3: Progress Tracker Settings */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Progress Tracker</h3>

                {/* Paydown visual */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Paydown Progress</span>
                    <span className="text-success font-bold text-2xl">{paydownPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-6 rounded-full bg-secondary overflow-hidden relative shadow-inner">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden bg-accent"
                      style={{
                        width: `${Math.min(100, paydownPercent)}%`,
                        boxShadow: `0 0 12px hsl(var(--accent) / 0.3)`,
                      }}
                    >
                      <div className="absolute inset-0 opacity-15" style={{ background: 'linear-gradient(180deg, white 0%, transparent 60%)' }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>${startingBalance.toLocaleString()}</span>
                    <span>${adjustedRemaining.toLocaleString()} remaining</span>
                    <span>$0</span>
                  </div>
                  {sellDownProceeds > 0 && (
                    <p className="text-xs text-success mt-1">Sell-down proceeds: −${sellDownProceeds.toLocaleString()} → ${adjustedRemaining.toLocaleString()} remaining</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Original Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={startingBalance.toLocaleString()}
                        onChange={(e) => setStartingBalance(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                        className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                      />
                    </div>
                  </div>

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
              </div>

              <div className="border-t border-border" />

              {/* Section 4: Valuation */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Valuation</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Purchase Price</label>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={purchasePrice ? purchasePrice.toLocaleString() : ""}
                        onChange={(e) => setPurchasePrice(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                        placeholder="Enter purchase price"
                        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium block mb-1">Current Value</label>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={currentValue ? currentValue.toLocaleString() : ""}
                        onChange={(e) => setPporValue(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                      />
                    </div>
                    {purchasePrice > 0 && (
                      <p className={`text-xs font-medium mt-1 ${growthPercent >= 0 ? "text-success" : "text-destructive"}`}>
                        {growthPercent >= 0 ? "↑" : "↓"} {Math.abs(growthPercent).toFixed(1)}% since purchase (${(currentValue - purchasePrice).toLocaleString()})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </section>
    </TooltipProvider>
  );
};

export default KeyInputs;
