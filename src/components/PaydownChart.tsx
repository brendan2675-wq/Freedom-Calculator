import { useMemo } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Target, CalendarClock } from "lucide-react";

interface Props {
  loanBalance: number;
  totalEquity: number;
  targetYear: number;
  targetMonth: number;
  setTargetMonth: (v: number) => void;
  setTargetYear: (v: number) => void;
  growthRate: number;
  interestRate: number;
}

const PaydownChart = ({ loanBalance, totalEquity, targetYear, targetMonth, setTargetMonth, setTargetYear, growthRate, interestRate }: Props) => {
  const data = useMemo(() => {
    const startYear = 2026;
    const points = [];
    const years = Math.max(1, targetYear - startYear + 3);
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = 30 * 12;
    
    const monthlyPayment = monthlyRate > 0
      ? loanBalance * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : loanBalance / totalMonths;

    let balance = loanBalance;
    for (let i = 0; i <= years; i++) {
      points.push({
        year: (startYear + i).toString(),
        loanRemaining: Math.round(Math.max(0, balance)),
      });
      for (let m = 0; m < 12; m++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        if (balance <= 0) { balance = 0; break; }
      }
    }
    return points;
  }, [loanBalance, targetYear, interestRate]);

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
      <div className="mb-5 pb-5 border-b border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Target size={16} className="text-accent" />
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Time Left</h3>
        </div>
        <div className="flex gap-4 justify-center items-center">
          {/* Years box */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
              <select
                value={duration.years}
                onChange={(e) => setDuration(Number(e.target.value), duration.months)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                {yearDurationOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <span className="text-3xl font-bold text-accent">{duration.years}</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground mt-2 uppercase tracking-wide">years</span>
          </div>

          <span className="text-lg font-medium text-muted-foreground/60 mt-[-1.5rem]">and</span>

          {/* Months box */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 rounded-xl bg-accent/5 border-2 border-accent/20 flex items-center justify-center shadow-sm">
              <select
                value={duration.months}
                onChange={(e) => setDuration(duration.years, Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              >
                {monthDurationOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <span className="text-3xl font-bold text-accent">{duration.months}</span>
            </div>
            <span className="text-[11px] font-medium text-muted-foreground mt-2 uppercase tracking-wide">months</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Target Exit: <span className="font-semibold text-foreground">{targetDateLabel}</span>
        </p>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-4">Paydown Projection</h3>
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
            <XAxis dataKey="year" fontSize={12} tick={{ fill: 'hsl(0, 0%, 42%)' }} />
            <YAxis tickFormatter={formatDollar} fontSize={11} tick={{ fill: 'hsl(0, 0%, 42%)' }} width={55} />
            <Tooltip
              formatter={(value: number) => [
                `$${value.toLocaleString()}`,
                'Loan Remaining',
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
              dataKey="loanRemaining"
              stroke="hsl(20, 60%, 52%)"
              fill="hsl(20, 60%, 52%)"
              fillOpacity={0.25}
              name="loanRemaining"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-6 mt-3 text-sm text-muted-foreground justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(20, 60%, 52%)', opacity: 0.6 }} />
          <span className="font-medium">Loan Remaining</span>
        </div>
      </div>
    </div>
  );
};

export default PaydownChart;
