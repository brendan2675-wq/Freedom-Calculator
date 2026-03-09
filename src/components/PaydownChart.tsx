import { useMemo } from "react";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Props {
  loanBalance: number;
  totalEquity: number;
  targetYear: number;
  targetMonth: number;
  growthRate: number;
}

const PaydownChart = ({ loanBalance, totalEquity, targetYear, targetMonth, growthRate }: Props) => {
  const data = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const points = [];
    const years = Math.max(1, targetYear - currentYear + 3);

    for (let i = 0; i <= years; i++) {
      const year = currentYear + i;
      // Equity grows with growth rate compounding
      const equityAtYear = totalEquity * Math.pow(1 + growthRate / 100, i);
      const remainingLoan = Math.max(0, loanBalance - equityAtYear);
      points.push({
        year: year.toString(),
        loanRemaining: Math.round(remainingLoan),
        equityAvailable: Math.round(Math.min(equityAtYear, loanBalance)),
      });
    }
    return points;
  }, [loanBalance, totalEquity, targetYear, growthRate]);

  const formatDollar = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="p-5">
      <h3 className="text-lg font-semibold text-foreground mb-4">Paydown Projection</h3>
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(36, 20%, 88%)" />
            <XAxis dataKey="year" fontSize={12} tick={{ fill: 'hsl(0, 0%, 42%)' }} />
            <YAxis tickFormatter={formatDollar} fontSize={11} tick={{ fill: 'hsl(0, 0%, 42%)' }} width={55} />
            <Tooltip
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'loanRemaining' ? 'Loan Remaining' : 'Equity Applied',
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
              dataKey="equityAvailable"
              stackId="1"
              stroke="hsl(140, 26%, 39%)"
              fill="hsl(140, 26%, 39%)"
              fillOpacity={0.45}
              name="equityAvailable"
            />
            <Area
              type="monotone"
              dataKey="loanRemaining"
              stackId="1"
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
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(140, 26%, 39%)', opacity: 0.7 }} />
          <span className="font-medium">Equity Applied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(20, 60%, 52%)', opacity: 0.6 }} />
          <span className="font-medium">Loan Remaining</span>
        </div>
      </div>
    </div>
  );
};

export default PaydownChart;
