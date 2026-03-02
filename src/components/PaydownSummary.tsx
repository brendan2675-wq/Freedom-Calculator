interface Props {
  totalEquity: number;
  loanRemaining: number;
  yearsToGoal: number;
  blurred: boolean;
}

const PaydownSummary = ({ totalEquity, loanRemaining, yearsToGoal, blurred }: Props) => {
  const ratio = loanRemaining > 0 ? totalEquity / loanRemaining : 1;
  let dotColor = "bg-success"; // green
  let status = "On track";
  if (ratio < 0.75) {
    dotColor = "bg-destructive";
    status = "Off track";
  } else if (ratio < 1) {
    dotColor = "bg-warning";
    status = "Close";
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-header z-50 border-t border-border">
      <div className={`container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3 transition-all ${blurred ? 'blur-md select-none' : ''}`}>
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <p className="text-primary-foreground text-xs uppercase tracking-wider">Total Equity</p>
            <p className="text-accent font-bold text-lg">${totalEquity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-primary-foreground text-xs uppercase tracking-wider">Loan Remaining</p>
            <p className="text-accent font-bold text-lg">${loanRemaining.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-primary-foreground text-xs uppercase tracking-wider">Years to Goal</p>
            <p className="text-accent font-bold text-lg">{yearsToGoal.toFixed(1)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
          <span className="text-primary-foreground text-sm font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default PaydownSummary;
