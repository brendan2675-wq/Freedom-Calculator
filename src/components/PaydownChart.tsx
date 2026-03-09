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

  const timeToTarget = useMemo(() => {
    const startMonth = 1;
    const startYear = 2026;
    let months = (targetYear - startYear) * 12 + (targetMonth - startMonth);
    if (months < 0) months = 0;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return `${years} year${years !== 1 ? 's' : ''} and ${rem} month${rem !== 1 ? 's' : ''}`;
  }, [targetMonth, targetYear]);

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 20 }, (_, i) => 2025 + i);

  const formatDollar = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarClock size={18} className="text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Target Exit Date</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-3">When you want to be debt-free</p>
          <div className="flex gap-3">
            <select
              value={targetMonth}
              onChange={(e) => setTargetMonth(Number(e.target.value))}
              className="flex-1 py-3 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {monthOptions.map((m) => (
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
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Target</h3>
          </div>
          <p className="text-accent font-bold text-xl">{timeToTarget}</p>
        </div>
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
