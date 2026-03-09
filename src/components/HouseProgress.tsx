interface HouseProgressProps {
  percentage: number;
  remaining: number;
}

const HouseProgress = ({ percentage }: HouseProgressProps) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div className="w-full h-6 rounded-full bg-muted border border-border overflow-hidden">
        <div
          className="h-full rounded-full bg-success transition-all duration-1000 ease-out flex items-center justify-end pr-2"
          style={{ width: `${Math.max(clampedPct, 8)}%` }}
        >
          <span className="text-[11px] font-bold text-success-foreground leading-none">
            {clampedPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default HouseProgress;
