import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Plus, X, ChevronRight, ChevronLeft, Info, Gavel } from "lucide-react";
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
  onDropFromPortfolio?: (id: string) => void;
}

const VISIBLE_SLOTS = 4;

const PropertiesToBuy = ({ properties, setProperties, growthRate, targetMonth, targetYear, onMoveToPortfolio, onDropFromPortfolio }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [properties.length, updateScrollState]);

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
      lvr: 80,
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
  const hasOverflow = properties.length >= VISIBLE_SLOTS;
  const cardWidth = hasOverflow ? "calc((100% - 36px) / 4.3)" : "calc((100% - 36px) / 4)";

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
        <div className="gold-underline pb-2 mb-1">
          <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Gavel size={26} strokeWidth={2.25} className="text-accent" />
            Your Proposed Purchases
            {properties.length > VISIBLE_SLOTS && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {properties.length} properties
              </span>
            )}
          </h2>
          </div>
        </div>
        <div className="h-4" />

        <div className="relative">
          {showArrows && canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent hover:shadow-md transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
          )}
          {showArrows && canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-accent hover:shadow-md transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
          )}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className={`flex gap-3 overflow-x-auto scrollbar-hide pb-2 rounded-xl transition-colors ${dragOver ? "bg-accent/10 ring-2 ring-accent/40" : ""}`}
          style={{ scrollSnapType: "x mandatory" }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-existing-property")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            setDraggingId(null);
            const id = e.dataTransfer.getData("application/x-existing-property");
            if (id && onDropFromPortfolio) {
              onDropFromPortfolio(id);
            }
          }}
        >
          {properties.map((p) => {
            const futureValue = Math.round(p.purchasePrice * Math.pow(1 + growthRate / 100, yearsToTarget));
            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-future-property", p.id);
                  e.dataTransfer.effectAllowed = "move";
                  setTimeout(() => setDraggingId(p.id), 0);
                }}
                onDragEnd={() => setDraggingId(null)}
                onClick={() => { if (!draggingId) setSelectedId(p.id); }}
                className={`group rounded-xl shadow-md p-4 border-2 transition-all relative flex flex-col shrink-0 ${
                  draggingId === p.id
                    ? "border-dashed border-accent/30 bg-accent/5 opacity-40"
                    : "bg-card border-border cursor-grab active:cursor-grabbing hover:shadow-xl hover:border-accent hover:shadow-accent/10"
                }`}
                style={{ width: cardWidth, minWidth: "200px", scrollSnapAlign: "start" }}
              >
                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
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
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  <div>
                    <label className="text-muted-foreground text-[11px]">Purchase Price</label>
                    <p className="text-foreground font-medium">${p.purchasePrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px]">Rental Yield</label>
                    <p className="text-foreground font-medium">{p.rentalYield}%</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px]">
                      {"Future Value (" + growthRate + "%)"}
                    </label>
                    <p className="text-accent font-medium">${futureValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px]">LVR</label>
                    <p className="text-foreground font-medium">{p.lvr ?? 80}%</p>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-4 pt-2 border-t border-border/70 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {p.ownership === "trust" ? "Trust" : "Personal"}
                  </span>
                </div>

              </div>
            );
          })}

          {/* Primary Add Property button */}
          <button
            onClick={addProperty}
            className="rounded-xl border-2 border-dashed border-accent/40 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent shrink-0 min-h-[180px]"
            style={{ width: cardWidth, minWidth: "200px", scrollSnapAlign: "start" }}
          >
            <Plus size={24} />
            <span className="text-sm">Add Property</span>
          </button>

          {/* Empty placeholder slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`empty-${i}`}
              onClick={addProperty}
              className="rounded-xl border-2 border-dashed border-border/30 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-accent/5 transition-all font-medium text-muted-foreground/40 shrink-0 min-h-[180px]"
              style={{ width: cardWidth, minWidth: "200px", scrollSnapAlign: "start" }}
            >
              <Plus size={20} />
            </button>
          ))}
        </div>
        </div>


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