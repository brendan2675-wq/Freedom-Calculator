import { useMemo } from "react";
import HouseProgress from "@/components/HouseProgress";

interface KeyInputsProps {
  loanBalance: number;
  setLoanBalance: (v: number) => void;
  targetMonth: number;
  targetYear: number;
  setTargetMonth: (v: number) => void;
  setTargetYear: (v: number) => void;
  percentage: number;
  remaining: number;
}

const KeyInputs = ({
  loanBalance, setLoanBalance,
  targetMonth, targetYear, setTargetMonth, setTargetYear,
  percentage, remaining,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Loan Balance */}
      <div className="bg-card rounded-xl shadow-md p-6 border border-border">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Loan to Pay Down</h3>
        <p className="text-muted-foreground text-sm mb-4">Current PPOR loan balance ($)</p>
        <div className="relative">
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
      </div>

      {/* Card 2: Target Date */}
      <div className="bg-card rounded-xl shadow-md p-6 border border-border">
        <h3 className="font-serif text-lg font-semibold text-foreground mb-1">Target Exit Date</h3>
        <p className="text-muted-foreground text-sm mb-4">When you want to be debt-free</p>
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
            className="w-28 py-3 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <p className="text-accent font-medium text-sm">{timeAway}</p>
      </div>

      {/* Card 3: Progress Tracker */}
      <div className="bg-card rounded-xl shadow-md p-4 border border-border flex items-center justify-center">
        <HouseProgress percentage={percentage} remaining={remaining} />
      </div>
    </div>
  );
};

export default KeyInputs;
