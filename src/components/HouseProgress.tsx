interface HouseProgressProps {
  percentage: number;
  remaining: number;
}

const HouseProgress = ({ percentage, remaining }: HouseProgressProps) => {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="flex flex-col items-center py-8">
      <div className="relative w-48 h-56 md:w-56 md:h-64">
        <svg viewBox="0 0 200 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="houseClip">
              {/* Roof */}
              <polygon points="100,10 10,100 190,100" />
              {/* Body */}
              <rect x="25" y="100" width="150" height="130" rx="4" />
            </clipPath>
          </defs>
          {/* House outline */}
          <polygon points="100,10 10,100 190,100" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <rect x="25" y="100" width="150" height="130" rx="4" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          {/* Fill from bottom */}
          <rect
            x="0"
            y={240 - (clampedPct / 100) * 230}
            width="200"
            height={(clampedPct / 100) * 230}
            fill="hsl(var(--success))"
            clipPath="url(#houseClip)"
            className="transition-all duration-1000 ease-out"
          />
          {/* Door */}
          <rect x="80" y="170" width="40" height="60" rx="3" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
          {/* Window left */}
          <rect x="40" y="120" width="30" height="30" rx="2" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
          {/* Window right */}
          <rect x="130" y="120" width="30" height="30" rx="2" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
          {/* Percentage text */}
          <text
            x="100"
            y="155"
            textAnchor="middle"
            fill="white"
            fontSize="28"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {clampedPct.toFixed(0)}%
          </text>
        </svg>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        <span className="text-success font-semibold">{clampedPct.toFixed(1)}% paid down</span>
        {' · '}
        <span className="font-medium">${remaining.toLocaleString()} remaining</span>
      </p>
    </div>
  );
};

export default HouseProgress;
