import { useState, useMemo } from "react";
import { Plus, X, ChevronRight, Info, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import { InvestmentTypeIcon } from "@/components/InvestmentTypeIcon";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

export type { ExistingProperty } from "@/types/property";

interface Props {
  properties: ExistingProperty[];
  setProperties: (p: ExistingProperty[]) => void;
  targetMonth: number;
  targetYear: number;
}

const ExistingProperties = ({ properties, setProperties, targetMonth, targetYear }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lvrRates, setLvrRates] = useState<Record<string, number>>({});

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  const yearsToTarget = useMemo(() => {
    const now = new Date();
    const target = new Date(targetYear, targetMonth - 1);
    return Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }, [targetMonth, targetYear]);

  const addProperty = () => {
    const newProperty: ExistingProperty = {
      id: crypto.randomUUID(),
      nickname: "",
      estimatedValue: 0,
      loanBalance: 0,
      earmarked: false,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails },
      rental: { ...defaultRentalDetails },
      purchase: { ...defaultPurchaseDetails },
    };
    setProperties([...properties, newProperty]);
    setSelectedId(newProperty.id);
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <TooltipProvider>
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
          Your Portfolio
        </h2>
        <div className="h-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => {
            const lvr = lvrRates[p.id] ?? 0.8;
            const equity = Math.max(0, (p.estimatedValue * lvr) - p.loanBalance);
            const futureValue = Math.round(p.estimatedValue * Math.pow(1.06, yearsToTarget));
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="group bg-card rounded-xl shadow-md p-5 border-2 border-border transition-all relative flex flex-col cursor-pointer hover:shadow-xl hover:border-accent/50 hover:-translate-y-1"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeProperty(p.id); }}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <InvestmentTypeIcon type={p.investmentType} size={20} className="text-accent shrink-0" />
                  <p className="font-semibold text-lg text-foreground">{p.nickname || "Untitled"}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="text-muted-foreground text-xs">Current Value</label>
                    <p className="text-foreground font-medium">${p.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Future Value <span className="text-[10px] text-accent">(6% p.a.)</span></label>
                    <p className="text-accent font-medium">${futureValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-muted-foreground text-xs">Current Loan</label>
                      {p.loan.interestOnlyPeriodYears === 0 && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                          <AlertTriangle size={10} className="text-destructive shrink-0" />
                          <span className="text-[10px] text-destructive font-medium leading-none">Update</span>
                        </div>
                      )}
                    </div>
                    <p className="text-foreground font-medium">${p.loanBalance.toLocaleString()}</p>
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-muted-foreground text-xs">Equity Available</p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={12} className="text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <p className="text-xs">(Current Value × LVR) − Loan Balance</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-accent font-bold">${equity.toLocaleString()}</span>
                      <select
                        value={lvr}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setLvrRates({ ...lvrRates, [p.id]: Number(e.target.value) });
                        }}
                        className="py-1 px-1.5 rounded border border-border bg-background text-foreground text-[10px] font-medium focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value={0.8}>80% LVR</option>
                        <option value={0.88}>88% LVR</option>
                        <option value={0.9}>90% LVR</option>
                        <option value={0.95}>95% LVR</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Ownership & earmarked badges */}
                <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    {p.ownership === "trust" ? "Trust" : "Personal"}
                  </span>
                  {p.earmarked && (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                      Sell down
                    </span>
                  )}
                </div>

                {/* Click cue */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Edit</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}

          <button
            onClick={addProperty}
            className="rounded-xl border-2 border-dashed border-accent/40 p-5 flex flex-col items-center justify-center gap-2 min-h-[200px] hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent"
          >
            <Plus size={28} />
            Add Property
          </button>
        </div>

        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedId}
          onOpenChange={(o) => {
            if (!o) {
              // Remove the property if it was just created with no data filled in
              if (selectedProperty && !selectedProperty.nickname && selectedProperty.estimatedValue === 0) {
                setProperties(properties.filter((p) => p.id !== selectedId));
              }
              setSelectedId(null);
            }
          }}
          onUpdate={(updated) => {
            setProperties(properties.map((p) => p.id === updated.id ? updated as ExistingProperty : p));
          }}
          variant="existing"
        />
      </section>
    </TooltipProvider>
  );
};

export default ExistingProperties;
