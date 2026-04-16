import { useMemo, useEffect, useRef, useState } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Target, Clock } from "lucide-react";
import type { SellDownEvent } from "@/components/KeyInputs";
import confetti from "canvas-confetti";

interface Props {
  loanBalance: number;
  totalEquity: number;
  targetYear: number;
  targetMonth: number;
  setTargetMonth: (v: number) => void;
  setTargetYear: (v: number) => void;
  growthRate: number;
  setGrowthRate: (v: number) => void;
  interestRate: number;
  sellDownEvents: SellDownEvent[];
  repaymentType: "pi" | "io";
  loanTermYears: number;
  loanTermMonths: number;
  ioPeriodYears: number;
}

const PaydownChart = ({ loanBalance, totalEquity, targetYear, targetMonth, setTargetMonth, setTargetYear, growthRate, setGrowthRate, interestRate, sellDownEvents, repaymentType, loanTermYears, loanTermMonths, ioPeriodYears }: Props) => {
  const [growthRateRaw, setGrowthRateRaw] = useState(growthRate.toFixed(2));
  const [growthFocused, setGrowthFocused] = useState(false);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const element = chartWrapperRef.current;
    if (!element) return;

    const updateWidth = () => setChartWidth(element.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setChartWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { if (!growthFocused) setGrowthRateRaw(growthRate.toFixed(2)); }, [growthRate, growthFocused]);
  const chartResult = useMemo(() => {
    const startYear = new Date().getFullYear();
    const years = Math.max(1, targetYear - startYear + 3);
    const monthlyRate = interestRate / 100 / 12;
    const totalLoanMonths = loanTermYears * 12 + loanTermMonths;
    const ioMonths = repaymentType === "io" ? ioPeriodYears * 12 : 0;
    const piMonths = Math.max(1, totalLoanMonths - ioMonths);

    // P&I monthly payment (calculated on balance over remaining months)
    const calcPIPayment = (balance: number, remainingMonths: number) => {
      const rm = Math.max(1, remainingMonths);
      if (monthlyRate <= 0 || balance <= 0) return balance / rm;
      return balance * (monthlyRate * Math.pow(1 + monthlyRate, rm)) / (Math.pow(1 + monthlyRate, rm) - 1);
    };

    // Aggregate sell-down proceeds by year
    const proceedsByYear: Record<number, number> = {};
    sellDownEvents.forEach((e) => {
      proceedsByYear[e.year] = (proceedsByYear[e.year] || 0) + e.proceeds;
    });

    const points = [];

    let standardBalance = loanBalance;
    let acceleratedBalance = loanBalance;
    let surplus = 0;
    let standardMonthElapsed = 0;
    let acceleratedMonthElapsed = 0;
    let standardPIPayment = 0;
    let acceleratedPIPayment = 0;

    for (let i = 0; i <= years; i++) {
      const year = startYear + i;

      // Apply lump-sum sell-down proceeds BEFORE recording the data point
      // so the balance drop is immediate in the sell year.
      if (proceedsByYear[year] && acceleratedBalance > 0) {
        acceleratedBalance -= proceedsByYear[year];
        if (acceleratedBalance < 0) {
          surplus += Math.abs(acceleratedBalance);
          acceleratedBalance = 0;
        }
      }

      points.push({
        year,
        standard: Math.round(Math.max(0, standardBalance)),
        accelerated: Math.round(Math.max(0, acceleratedBalance)),
      });

      // Simulate 12 months
      for (let m = 0; m < 12; m++) {
        // Standard line
        if (standardBalance > 0) {
          if (standardMonthElapsed < ioMonths) {
            // IO period: only pay interest, balance stays flat
          } else {
            if (standardMonthElapsed === ioMonths) {
              standardPIPayment = calcPIPayment(standardBalance, piMonths);
            }
            const interest = standardBalance * monthlyRate;
            const principal = standardPIPayment - interest;
            standardBalance -= principal;
            if (standardBalance < 0) standardBalance = 0;
          }
          standardMonthElapsed++;
        }

        // Accelerated line (keeps original payment after lump sums to pay off faster)
        if (acceleratedBalance > 0) {
          if (acceleratedMonthElapsed < ioMonths) {
            // IO period: only pay interest, balance stays flat
          } else {
            if (acceleratedMonthElapsed === ioMonths) {
              acceleratedPIPayment = calcPIPayment(acceleratedBalance, piMonths);
            }
            const interest = acceleratedBalance * monthlyRate;
            const principal = acceleratedPIPayment - interest;
            acceleratedBalance -= principal;
            if (acceleratedBalance < 0) acceleratedBalance = 0;
          }
          acceleratedMonthElapsed++;
        }
      }
    }
    return { points, surplus };
  }, [loanBalance, targetYear, interestRate, sellDownEvents, repaymentType, loanTermYears, loanTermMonths, ioPeriodYears]);

  const data = chartResult.points;
  const surplusProfit = chartResult.surplus;

  const hasSellDowns = sellDownEvents.length > 0;

  const groupedSellDowns = useMemo(() => {
    const grouped: Record<number, string[]> = {};
    sellDownEvents.forEach((event) => {
      if (!grouped[event.year]) grouped[event.year] = [];
      grouped[event.year].push(event.nickname);
    });
    return Object.entries(grouped)
      .map(([year, names]) => ({ year: Number(year), names }))
      .sort((a, b) => a.year - b.year);
  }, [sellDownEvents]);

  const sellLabelLayout = useMemo(() => {
    if (!hasSellDowns || groupedSellDowns.length === 0) {
      return { chartTopMargin: 50, labels: [] as Array<{ key: string; left: number; top: number; name: string }> };
    }

    const minYear = data[0]?.year ?? new Date().getFullYear();
    const maxYear = data[data.length - 1]?.year ?? minYear + 1;
    const span = Math.max(1, maxYear - minYear);
    const plotLeftPx = 70;
    const plotRightPx = 10;
    const plotWidthPx = Math.max(280, chartWidth - plotLeftPx - plotRightPx);
    const labelRowHeight = 16;
    const topPadding = 8;
    const minGapPx = 12;
    const adjacentYearGapPx = 110;

    const flattenedLabels = groupedSellDowns.flatMap((entry) =>
      entry.names.map((name, nameIndex) => ({
        key: `${entry.year}-${name}-${nameIndex}`,
        year: entry.year,
        name,
        pct: Math.min(1, Math.max(0, (entry.year - minYear) / span)),
      }))
    );

    const levelState: Array<{ right: number; year: number; x: number }> = [];

    const placedLabels = flattenedLabels.map((label) => {
      const width = Math.max(56, label.name.length * 6.5 + 10);
      const x = plotLeftPx + plotWidthPx * label.pct;
      const unclampedLeft = x - width / 2;
      const left = Math.max(plotLeftPx, Math.min(plotLeftPx + plotWidthPx - width, unclampedLeft));

      let level = 0;
      while (true) {
        const currentLevel = levelState[level];
        if (!currentLevel) break;

        const overlapsHorizontally = left < currentLevel.right + minGapPx;
        const adjacentYearTooClose = Math.abs(label.year - currentLevel.year) <= 1 && Math.abs(x - currentLevel.x) < adjacentYearGapPx;

        if (!overlapsHorizontally && !adjacentYearTooClose) break;
        level += 1;
      }

      levelState[level] = { right: left + width, year: label.year, x };

      return {
        ...label,
        left,
        level,
      };
    });

    const maxLevel = placedLabels.reduce((max, label) => Math.max(max, label.level), 0);
    const baselineY = topPadding + maxLevel * labelRowHeight;

    return {
      chartTopMargin: baselineY + labelRowHeight + 10,
      labels: placedLabels.map((label) => ({
        key: label.key,
        left: label.left,
        top: baselineY - label.level * labelRowHeight,
        name: label.name,
      })),
    };
  }, [chartWidth, data, groupedSellDowns, hasSellDowns]);

  // Compute payoff years for time-saved callout (improvement #2)
  const timeSaved = useMemo(() => {
    if (!hasSellDowns) return null;
    const startYear = new Date().getFullYear();
    const standardPayoffYear = data.find((d, i) => i > 0 && d.standard <= 0)?.year;
    const acceleratedPayoffYear = data.find((d, i) => i > 0 && d.accelerated <= 0)?.year;
    const stdYears = standardPayoffYear ? standardPayoffYear - startYear : null;
    const accYears = acceleratedPayoffYear ? acceleratedPayoffYear - startYear : null;
    if (stdYears === null || accYears === null) return null;
    const saved = stdYears - accYears;
    if (saved <= 0) return null;
    return { standardYears: stdYears, acceleratedYears: accYears, saved };
  }, [data, hasSellDowns]);

  // Check if accelerated balance is at or below zero by target year
  const goalAchieved = useMemo(() => {
    if (!hasSellDowns) return false;
    const targetPoint = data.find((d) => d.year === targetYear);
    return targetPoint ? targetPoint.accelerated <= 0 : false;
  }, [data, targetYear, hasSellDowns]);

  const prevGoalAchieved = useRef(false);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confettiAnimationRef = useRef<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const wasGoalAchieved = prevGoalAchieved.current;
    prevGoalAchieved.current = goalAchieved;

    if (!goalAchieved) {
      setShowCelebration(false);
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
      if (confettiAnimationRef.current) {
        cancelAnimationFrame(confettiAnimationRef.current);
        confettiAnimationRef.current = null;
      }
      return;
    }

    if (wasGoalAchieved) return;

    setShowCelebration(true);

    const end = Date.now() + 2500;
    const fire = () => {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.5, x: 0.5 },
        colors: ['#E8914F', '#D4782F', '#F5C28A', '#FFD700', '#FF6B35'],
        scalar: 0.6,
        gravity: 1.2,
      });

      if (Date.now() < end) {
        confettiAnimationRef.current = requestAnimationFrame(fire);
      } else {
        confettiAnimationRef.current = null;
      }
    };

    fire();

    celebrationTimerRef.current = setTimeout(() => {
      setShowCelebration(false);
      celebrationTimerRef.current = null;
    }, 5000);

    return () => {
      if (celebrationTimerRef.current) {
        clearTimeout(celebrationTimerRef.current);
        celebrationTimerRef.current = null;
      }
      if (confettiAnimationRef.current) {
        cancelAnimationFrame(confettiAnimationRef.current);
        confettiAnimationRef.current = null;
      }
    };
  }, [goalAchieved]);

  // Compute years/months duration from now to target
  const duration = useMemo(() => {
    const now = new Date();
    let months = (targetYear - now.getFullYear()) * 12 + (targetMonth - now.getMonth() - 1);
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return { years, months: rem };
  }, [targetMonth, targetYear]);

  // Compute target date label
  const targetDateLabel = useMemo(() => {
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' });
    return `${monthName} ${targetYear}`;
  }, [targetMonth, targetYear]);

  // Update target from duration dropdowns
  const setDuration = (years: number, months: number) => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth() + years * 12 + months);
    setTargetMonth(target.getMonth() + 1);
    setTargetYear(target.getFullYear());
  };

  const yearDurationOptions = Array.from({ length: 31 }, (_, i) => i);
  const monthDurationOptions = Array.from({ length: 12 }, (_, i) => i);

  const formatDollar = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="p-5">
      <div className="mb-5 pb-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Icon + Title + Target date */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Target size={20} className="text-accent md:hidden" strokeWidth={2.5} />
              <Target size={24} className="text-accent hidden md:block" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-foreground">Target Paydown</h3>
              <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">
                Target: <span className="font-semibold text-foreground">{targetDateLabel}</span>
              </p>
            </div>
          </div>

          {/* Right: Countdown boxes */}
          <div className="flex gap-2 md:gap-3 items-center bg-secondary/60 border border-border rounded-2xl px-2.5 md:px-4 py-2.5 md:py-3 shadow-sm self-stretch sm:self-auto overflow-x-auto">
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <select
                  value={duration.years}
                  onChange={(e) => setDuration(Number(e.target.value), duration.months)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {yearDurationOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-xl md:text-2xl font-bold text-accent">{duration.years}</span>
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground mt-1 md:mt-1.5 uppercase tracking-wide">years</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground/50 mt-[-0.75rem]">:</span>
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <select
                  value={duration.months}
                  onChange={(e) => setDuration(duration.years, Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {monthDurationOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-xl md:text-2xl font-bold text-accent">{duration.months}</span>
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground mt-1 md:mt-1.5 uppercase tracking-wide">months</span>
            </div>
            <div className="w-px h-8 md:h-10 bg-border mx-0.5 md:mx-1" />
            <div className="flex flex-col items-center">
              <div className="relative w-16 md:w-24 h-12 md:h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <input
                  type="text"
                  inputMode="decimal"
                  value={growthRateRaw}
                  onFocus={() => setGrowthFocused(true)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*\.?\d{0,2}$/.test(val) || val === "") {
                      setGrowthRateRaw(val);
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed)) setGrowthRate(parsed);
                    }
                  }}
                  onBlur={() => {
                    setGrowthFocused(false);
                    const parsed = parseFloat(growthRateRaw);
                    if (!isNaN(parsed)) {
                      setGrowthRate(parsed);
                      setGrowthRateRaw(parsed.toFixed(2));
                    } else {
                      setGrowthRateRaw(growthRate.toFixed(2));
                    }
                  }}
                  className="w-full h-full bg-transparent text-center text-base md:text-lg font-bold text-accent outline-none"
                />
                <span className="absolute right-1 md:right-1.5 text-accent/60 text-xs md:text-sm font-semibold pointer-events-none">%</span>
              </div>
              <span className="text-[9px] md:text-[10px] font-medium text-muted-foreground mt-1 md:mt-1.5 uppercase tracking-wide">growth</span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Paydown Projection</h3>
      {timeSaved && (
        <div className="mb-4 rounded-xl bg-accent/8 border border-accent/20 px-5 py-3.5 flex items-center gap-3">
          <Clock size={18} className="text-accent shrink-0" />
          <p className="text-sm text-foreground">
            Without sell-down: <span className="font-semibold">{timeSaved.standardYears} yrs</span>.
            With sell-down: <span className="font-semibold text-accent">{timeSaved.acceleratedYears} yrs</span>.
            <span className="font-bold text-success ml-1">You save {timeSaved.saved} years!</span>
          </p>
        </div>
      )}
      {showCelebration && (
        <div className="mb-4 rounded-2xl bg-accent/15 border-2 border-accent px-6 py-5 text-center shadow-lg relative z-20 animate-fade-in">
          <button
            onClick={() => setShowCelebration(false)}
            className="absolute top-2 right-3 text-accent/60 hover:text-accent text-lg font-bold leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
          <p className="text-accent font-extrabold text-2xl mb-1">🎉 Goal Achieved!</p>
          <p className="text-foreground text-base font-medium">Your strategy pays off the loan before the target date!</p>
        </div>
      )}
      <div ref={chartWrapperRef} className={hasSellDowns && groupedSellDowns.length > 0 ? "h-72 md:h-80 relative" : "h-64 md:h-72 relative"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: hasSellDowns ? sellLabelLayout.chartTopMargin : 20, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
            <XAxis
              dataKey="year"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickCount={chartWidth < 500 ? Math.min(data.length, 5) : data.length}
              interval={chartWidth < 500 ? "preserveStartEnd" : 0}
              fontSize={chartWidth < 500 ? 9 : 12}
              tick={{ fill: 'hsl(0, 0%, 25%)', fontWeight: 500 }}
              angle={chartWidth < 500 ? -45 : -35}
              textAnchor="end"
              height={chartWidth < 500 ? 30 : 45}
              tickFormatter={(val: number) => chartWidth < 400 ? `'${String(val).slice(2)}` : String(val)}
            />
            <YAxis
              tickFormatter={formatDollar}
              fontSize={chartWidth < 500 ? 9 : 13}
              tick={{ fill: 'hsl(0, 0%, 25%)', fontWeight: 500 }}
              width={chartWidth < 500 ? 40 : 60}
              tickCount={chartWidth < 500 ? 4 : undefined}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'standard' ? 'Loan Balance' : 'With Sell-Down',
              ]}
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(36, 20%, 88%)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <ReferenceLine x={targetYear + (targetMonth - 1) / 12} stroke="hsl(20, 60%, 52%)" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Target", fill: "hsl(20, 60%, 42%)", fontSize: 13, fontWeight: 600, position: "top" }} />
            {/* Sell-down event dotted lines */}
            {groupedSellDowns.map((entry) => (
              <ReferenceLine
                key={`sell-${entry.year}`}
                x={entry.year}
                stroke="hsl(142, 55%, 42%)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ))}
            <Area
              type="monotone"
              dataKey="standard"
              stroke="hsl(0, 0%, 65%)"
              fill="hsl(0, 0%, 65%)"
              fillOpacity={0.1}
              strokeDasharray={hasSellDowns ? "5 5" : undefined}
              strokeWidth={hasSellDowns ? 1.5 : 2}
              name="standard"
            />
            {hasSellDowns && (
              <Area
                type="monotone"
                dataKey="accelerated"
                stroke="hsl(20, 60%, 52%)"
                fill="hsl(20, 60%, 52%)"
                fillOpacity={0.25}
                strokeWidth={2.5}
                name="accelerated"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        {hasSellDowns && sellLabelLayout.labels.length > 0 && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {sellLabelLayout.labels.map((label) => (
              <span
                key={label.key}
                className="absolute text-[10px] font-semibold leading-none text-success whitespace-nowrap"
                style={{
                  left: `${label.left}px`,
                  top: label.top,
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6 mt-2 text-sm text-muted-foreground justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: hasSellDowns ? 'hsl(0, 0%, 65%)' : 'hsl(20, 60%, 52%)', opacity: 0.6 }} />
          <span className="font-medium">Loan Balance</span>
        </div>
        {hasSellDowns && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(20, 60%, 52%)', opacity: 0.8 }} />
            <span className="font-medium">With Sell-Down</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaydownChart;
