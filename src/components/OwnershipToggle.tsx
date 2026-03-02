interface OwnershipToggleProps {
  value: "trust" | "personal";
  onChange: (v: "trust" | "personal") => void;
}

const OwnershipToggle = ({ value, onChange }: OwnershipToggleProps) => {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm">
      <button
        onClick={() => onChange("trust")}
        className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
          value === "trust"
            ? "bg-accent text-accent-foreground"
            : "bg-background text-muted-foreground hover:text-foreground"
        }`}
      >
        Trust
      </button>
      <button
        onClick={() => onChange("personal")}
        className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
          value === "personal"
            ? "bg-accent text-accent-foreground"
            : "bg-background text-muted-foreground hover:text-foreground"
        }`}
      >
        Personal Name
      </button>
    </div>
  );
};

export default OwnershipToggle;
