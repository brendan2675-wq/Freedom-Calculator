import { LucideIcon } from "lucide-react";

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  step?: number;
  completed?: boolean;
  className?: string;
}

const EmptyStateCard = ({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCta,
  step,
  completed,
  className = "",
}: EmptyStateCardProps) => {
  return (
    <div
      className={`relative bg-card rounded-2xl border-2 ${
        completed ? "border-accent/40 bg-accent/5" : "border-border"
      } p-5 md:p-6 flex flex-col gap-3 ${className}`}
    >
      {step !== undefined && (
        <div
          className={`absolute -top-3 left-5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            completed
              ? "bg-accent text-accent-foreground"
              : "bg-foreground text-background"
          }`}
        >
          {completed ? "✓" : step}
        </div>
      )}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          completed ? "bg-accent/15" : "bg-accent/10"
        }`}
      >
        <Icon size={24} className="text-accent" />
      </div>
      <div className="flex-1">
        <h3 className="text-base md:text-lg font-bold text-foreground mb-1">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground leading-snug">{description}</p>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className={`mt-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
            completed
              ? "bg-accent/10 text-accent hover:bg-accent/15"
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          }`}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyStateCard;
