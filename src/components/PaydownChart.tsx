import { useMemo, useEffect, useRef, useState } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Target } from "lucide-react";
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
}

const PaydownChart = ({ loanBalance, totalEquity, targetYear, targetMonth, setTargetMonth, setTargetYear, growthRate, setGrowthRate, interestRate, sellDownEvents }: Props) => {
  const data = useMemo(() => {
    const startYear = new Date().getFullYear();
    const years = Math.max(1, targetYear - startYear + 3);
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = 30 * 12;

    const monthlyPayment = monthlyRate > 0
      ? loanBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanBalance / totalMonths;

    // Aggregate sell-down proceeds by year
    const proceedsByYear: Record<number, number> = {};
    sellDownEvents.forEach((e) => {
      proceedsByYear[e.year] = (proceedsByYear[e.year] || 0) + e.proceeds;
    });

    const points = [];

    // Standard amortization
    let standardBalance = loanBalance;
    // Accelerated (with sell-down lump sums applied)
    let acceleratedBalance = loanBalance;

    for (let i = 0; i <= years; i++) {
      const year = startYear + i;

      points.push({
        year: year.toString(),
        standard: Math.round(Math.max(0, standardBalance)),
        accelerated: Math.round(Math.max(0, acceleratedBalance)),
      });

      // Simulate 12 months of P&I for both
      for (let m = 0; m < 12; m++) {
        if (standardBalance > 0) {
          const interest = standardBalance * monthlyRate;
          const principal = monthlyPayment - interest;
          standardBalance -= principal;
          if (standardBalance < 0) standardBalance = 0;
        }
        if (acceleratedBalance > 0) {
          const interest = acceleratedBalance * monthlyRate;
          const principal = monthlyPayment - interest;
          acceleratedBalance -= principal;
          if (acceleratedBalance < 0) acceleratedBalance = 0;
        }
      }

      // Apply lump-sum sell-down proceeds at end of year for accelerated line
      const nextYear = year + 1;
      if (proceedsByYear[nextYear] && acceleratedBalance > 0) {
        acceleratedBalance -= proceedsByYear[nextYear];
        if (acceleratedBalance < 0) acceleratedBalance = 0;
      }
    }
    return points;
  }, [loanBalance, targetYear, interestRate, sellDownEvents]);

  const hasSellDowns = sellDownEvents.length > 0;

  // Check if accelerated balance is at or below zero by target year
  const goalAchieved = useMemo(() => {
    if (!hasSellDowns) return false;
    const targetPoint = data.find((d) => d.year === targetYear.toString());
    return targetPoint ? targetPoint.accelerated <= 0 : false;
  }, [data, targetYear, hasSellDowns]);

  const prevGoalAchieved = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (goalAchieved && !prevGoalAchieved.current) {
      setShowCelebration(true);

      // Create a canvas scoped to the container
      if (containerRef.current) {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '10';
        containerRef.current.appendChild(canvas);
        canvasRef.current = canvas;

        const scopedConfetti = confetti.create(canvas, { resize: true });
        const end = Date.now() + 2500;
        const fire = () => {
          scopedConfetti({
            particleCount: 60,
            spread: 80,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#E8914F', '#D4782F', '#F5C28A', '#FFD700', '#FF6B35'],
          });
          if (Date.now() < end) requestAnimationFrame(fire);
        };
        fire();
      }

      const timer = setTimeout(() => {
        setShowCelebration(false);
        if (canvasRef.current && canvasRef.current.parentNode) {
          canvasRef.current.parentNode.removeChild(canvasRef.current);
          canvasRef.current = null;
        }
      }, 4000);
      return () => {
        clearTimeout(timer);
        if (canvasRef.current && canvasRef.current.parentNode) {
          canvasRef.current.parentNode.removeChild(canvasRef.current);
          canvasRef.current = null;
        }
      };
    }
    prevGoalAchieved.current = goalAchieved;
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
    <div ref={containerRef} className="p-5 relative overflow-hidden">
      <div className="mb-5 pb-5 border-b border-border">
        <div className="flex items-center justify-between">
          {/* Left: Icon + Title + Target date */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target size={24} className="text-accent" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Target Paydown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target: <span className="font-semibold text-foreground">{targetDateLabel}</span>
              </p>
            </div>
          </div>

          {/* Right: Countdown boxes */}
          <div className="flex gap-3 items-center bg-secondary/60 border border-border rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <select
                  value={duration.years}
                  onChange={(e) => setDuration(Number(e.target.value), duration.months)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {yearDurationOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-2xl font-bold text-accent">{duration.years}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wide">years</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground/50 mt-[-1rem]">:</span>
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <select
                  value={duration.months}
                  onChange={(e) => setDuration(duration.years, Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {monthDurationOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <span className="text-2xl font-bold text-accent">{duration.months}</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wide">months</span>
            </div>
            <div className="w-px h-10 bg-border mx-1" />
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
                <select
                  value={growthRate}
                  onChange={(e) => setGrowthRate(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                >
                  {Array.from({ length: 51 }, (_, i) => (4 + i * 0.1).toFixed(1)).map((v) => (
                    <option key={v} value={Number(v)}>{v}%</option>
                  ))}
                </select>
                <span className="text-lg font-bold text-accent">{growthRate}%</span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1.5 uppercase tracking-wide">growth</span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Paydown Projection</h3>
      {showCelebration && (
        <div className="animate-fade-in mb-4 rounded-xl bg-accent/10 border border-accent/30 px-4 py-3 text-center">
          <p className="text-accent font-bold text-lg">🎉 Goal Achieved!</p>
          <p className="text-muted-foreground text-sm">Your strategy pays off the loan before the target date!</p>
        </div>
      )}
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
            <XAxis dataKey="year" fontSize={13} tick={{ fill: 'hsl(0, 0%, 25%)', fontWeight: 500 }} />
            <YAxis tickFormatter={formatDollar} fontSize={13} tick={{ fill: 'hsl(0, 0%, 25%)', fontWeight: 500 }} width={60} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'standard' ? 'Standard P&I' : 'With Sell-Down',
              ]}
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 100%)',
                border: '1px solid hsl(36, 20%, 88%)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
            <ReferenceLine x={targetYear.toString()} stroke="hsl(20, 60%, 52%)" strokeDasharray="5 5" strokeWidth={2} label={{ value: "Target", fill: "hsl(20, 60%, 42%)", fontSize: 13, fontWeight: 600, position: "top" }} />
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
      </div>
      <div className="flex gap-6 mt-3 text-sm text-muted-foreground justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: hasSellDowns ? 'hsl(0, 0%, 65%)' : 'hsl(20, 60%, 52%)', opacity: 0.6 }} />
          <span className="font-medium">Standard P&I</span>
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
