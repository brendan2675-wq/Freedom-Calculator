import { useState, useMemo, useRef } from "react";
import { Plus, X, ChevronRight, ChevronLeft, Info, ArrowUpRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import { InvestmentTypeIcon } from "@/components/InvestmentTypeIcon";
import type { FutureProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

export type { FutureProperty } from "@/types/property";

interface Props {
  properties: FutureProperty[];
  setProperties: (p: FutureProperty[]) => void;
  growthRate: number;
  targetMonth: number;
  targetYear: number;
  onMoveToPortfolio: (p: FutureProperty) => void;
}

const VISIBLE_SLOTS = 5;

const PropertiesToBuy = ({ properties, setProperties, growthRate, targetMonth, targetYear, onMoveToPortfolio }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  const yearsToTarget = useMemo(() => {
    const now = new Date();
    const target = new Date(targetYear, targetMonth - 1);
    return Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }, [targetMonth, targetYear]);

  const addProperty = () => {
    const newProperty: FutureProperty = {
      id: crypto.randomUUID(),
      suburb: "",
      purchasePrice: 0,
      rentalYield: 0,
      projectedEquity5yr: 0,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails },
      rental: { ...defaultRentalDetails },
      purchase: { ...defaultPurchaseDetails },
    };
    setProperties([...properties, newProperty]);
    setSelectedId(newProperty.id);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }, 50);
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const emptySlots = Math.max(0, VISIBLE_SLOTS - properties.length - 1);
  const totalItems = properties.length + 1 + emptySlots;
  const showArrows = totalItems > VISIBLE_SLOTS || properties.length >= VISIBLE_SLOTS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild?.getBoundingClientRect().width ?? 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -(cardWidth + 12) : (cardWidth + 12),
      behavior: "smooth",
    });
  };

  const totalEquity = properties.reduce((sum, p) => sum + p.projectedEquity5yr, 0);

  return (
    <TooltipProvider>
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-2xl font-bold text-foreground gold-underline pb-2">
            Your Proposed Purchases
          </h2>
          {showArrows && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll("left")}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
        <div className="h-4" />

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {properties.map((p) => {
            const futureValue = Math.round(p.purchasePrice * Math.pow(1 + growthRate / 100, yearsToTarget));
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="group bg-card rounded-xl shadow-md p-4 border-2 border-border transition-all relative flex flex-col cursor-pointer hover:shadow-xl hover:border-accent/50 hover:-translate-y-1 shrink-0"
                style={{ width: "calc((100% - 48px) / 5)", minWidth: "200px", scrollSnapAlign: "start" }}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveToPortfolio(p);
                        }}
                        className="text-accent hover:text-accent/80 hover:bg-accent/10 rounded p-0.5 transition-colors"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Move to Portfolio</p>
                    </TooltipContent>
                  </Tooltip>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeProperty(p.id); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <InvestmentTypeIcon type={p.investmentType} size={16} className="text-accent shrink-0" />
                  <p className="font-semibold text-sm text-foreground truncate">{p.suburb || "Untitled"}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <label className="text-muted-foreground text-[10px]">Purchase Price</label>
                    <p className="text-foreground font-medium">${p.purchasePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px]">Rental Yield</label>
                    <p className="text-foreground font-medium">{p.rentalYield}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px]">Future Value <span className="text-accent">(6% p.a.)</span></label>
                    <p className="text-accent font-medium">${futureValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      <label className="text-muted-foreground text-[10px]">Proj. Equity (5yr)</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={10} className="text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="text-xs">Estimated equity after 5 years based on growth rate and 80% LVR.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-accent font-bold">${p.projectedEquity5yr.toLocaleString()}</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-auto pt-2 border-t border-border flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {p.ownership === "trust" ? "Trust" : "Personal"}
                  </span>
                </div>

                {/* Click cue */}
                <div className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Edit</span>
                  <ChevronRight size={12} />
                </div>
              </div>
            );
          })}

          {/* Primary Add Property button */}
          <button
            onClick={addProperty}
            className="rounded-xl border-2 border-dashed border-accent/40 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent shrink-0"
            style={{ width: "calc((100% - 48px) / 5)", minWidth: "200px", scrollSnapAlign: "start" }}
          >
            <Plus size={24} />
            <span className="text-sm">Add Property</span>
          </button>

          {/* Empty placeholder slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`empty-${i}`}
              onClick={addProperty}
              className="rounded-xl border-2 border-dashed border-border/30 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-accent/5 transition-all font-medium text-muted-foreground/40 shrink-0"
              style={{ width: "calc((100% - 48px) / 5)", minWidth: "200px", scrollSnapAlign: "start" }}
            >
              <Plus size={20} />
            </button>
          ))}
        </div>

        {properties.length > 0 && (
          <div className="mt-4 bg-header rounded-xl p-3 text-center">
            <p className="text-primary-foreground text-sm">Total projected equity available</p>
            <p className="text-accent text-2xl font-bold">${totalEquity.toLocaleString()}</p>
          </div>
        )}

        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedId}
          onOpenChange={(o) => {
            if (!o) {
              if (selectedProperty && !selectedProperty.suburb && selectedProperty.purchasePrice === 0) {
                setProperties(properties.filter((p) => p.id !== selectedId));
              }
              setSelectedId(null);
            }
          }}
          onUpdate={(updated) => {
            setProperties(properties.map((p) => p.id === updated.id ? updated as FutureProperty : p));
          }}
          variant="future"
        />
      </section>
    </TooltipProvider>
  );
};

export default PropertiesToBuy;