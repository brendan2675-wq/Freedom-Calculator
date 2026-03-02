import { Home, Building2, Building, Store } from "lucide-react";
import type { InvestmentType } from "@/types/property";

const iconMap = {
  house: Home,
  townhouse: Building2,
  unit: Building,
  commercial: Store,
} as const;

const labelMap: Record<InvestmentType, string> = {
  house: "House",
  townhouse: "Townhouse",
  unit: "Unit",
  commercial: "Commercial",
};

export function InvestmentTypeIcon({ type, size = 18, className = "" }: { type: InvestmentType; size?: number; className?: string }) {
  const Icon = iconMap[type];
  return <Icon size={size} className={className} />;
}

export function getInvestmentTypeLabel(type: InvestmentType) {
  return labelMap[type];
}

export const investmentTypes: InvestmentType[] = ["house", "townhouse", "unit", "commercial"];
