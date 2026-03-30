import { useState } from "react";
import { Input } from "@/components/ui/input";

interface OwnershipToggleProps {
  value: "trust" | "personal";
  onChange: (v: "trust" | "personal") => void;
  trustName?: string;
  onTrustNameChange?: (name: string) => void;
}

const OwnershipToggle = ({ value, onChange, trustName = "", onTrustNameChange }: OwnershipToggleProps) => {
  const [showTrustInput, setShowTrustInput] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex rounded-lg border border-border overflow-hidden text-sm">
        <button
          onClick={() => { onChange("personal"); setShowTrustInput(false); }}
          className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
            value === "personal"
              ? "bg-accent text-accent-foreground"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          Personal Name
        </button>
        <button
          onClick={() => { onChange("trust"); setShowTrustInput(true); }}
          className={`flex-1 px-3 py-1.5 font-medium transition-colors ${
            value === "trust"
              ? "bg-accent text-accent-foreground"
              : "bg-background text-muted-foreground hover:text-foreground"
          }`}
        >
          Trust
        </button>
      </div>
      {value === "trust" && (
        <Input
          value={trustName}
          onChange={(e) => onTrustNameChange?.(e.target.value)}
          placeholder="Enter trust name"
          className="text-sm h-8"
        />
      )}
    </div>
  );
};

export default OwnershipToggle;
