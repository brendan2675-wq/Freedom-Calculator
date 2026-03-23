import { useState, useMemo, useRef } from "react";
import { Plus, X, ChevronRight, ChevronLeft, Info, AlertTriangle, Briefcase, BadgeDollarSign } from "lucide-react";
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
  growthRate: number;
  onMoveToProposals?: (p: ExistingProperty) => void;
  onDropFromProposals?: (id: string) => void;
}

const VISIBLE_SLOTS = 4;

const ExistingProperties = ({ properties, setProperties, targetMonth, targetYear, growthRate, onMoveToProposals, onDropFromProposals }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lvrRates, setLvrRates] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [masterSellYear, setMasterSellYear] = useState(0);

  const allEarmarked = properties.length > 0 && properties.every((p) => p.earmarked);

  const handleMasterSellDown = () => {
    setProperties(
      properties.map((p) => ({
        ...p,
        earmarked: !allEarmarked,
        sellInYears: !allEarmarked ? masterSellYear : p.sellInYears,
      }))
    );
  };

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
      sellInYears: 0,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails },
      rental: { ...defaultRentalDetails },
      purchase: { ...defaultPurchaseDetails },
    };
    setProperties([...properties, newProperty]);
    setSelectedId(newProperty.id);
    // Scroll to end after adding
    setTimeout(() => {
      scrollRef.current?.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
    }, 50);
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Number of empty "Add Property" slots to fill up to 5
  const emptySlots = Math.max(0, VISIBLE_SLOTS - properties.length - 1);
  const totalItems = properties.length + 1 + emptySlots; // properties + main add button + empty slots
  const showArrows = totalItems > VISIBLE_SLOTS || properties.length >= VISIBLE_SLOTS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild?.getBoundingClientRect().width ?? 240;
    const scrollAmount = cardWidth + 12; // card width + gap
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <TooltipProvider>
      <section>
        <div className="gold-underline pb-2 mb-1">
          <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Briefcase size={26} strokeWidth={2.25} className="text-accent" />
            Your Investment Portfolio
            {properties.length > VISIBLE_SLOTS && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {properties.length} properties
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {properties.length > 0 && (
              <div className="flex items-center gap-1.5">
                <select
                  value={masterSellYear}
                  onChange={(e) => setMasterSellYear(Number(e.target.value))}
                  className="py-1.5 px-2 rounded-md border border-border bg-background text-foreground text-xs font-medium focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                >
                  <option value={0}>Now</option>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i + 1 === 1 ? "year" : "years"}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleMasterSellDown}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    allEarmarked
                      ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : "border-accent/30 bg-accent/10 text-accent hover:bg-accent/20"
                  }`}
                >
                  <BadgeDollarSign size={14} />
                  {allEarmarked ? "Clear Sell Down" : "Sell Down All"}
                </button>
              </div>
            )}
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
          </div>
        </div>
        <div className="h-4" />

        <div
          ref={scrollRef}
          className={`flex gap-3 overflow-x-auto scrollbar-hide pb-2 rounded-xl transition-colors ${dragOver ? "bg-accent/10 ring-2 ring-accent/40" : ""}`}
          style={{ scrollSnapType: "x mandatory" }}
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("application/x-future-property")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            setDraggingId(null);
            const id = e.dataTransfer.getData("application/x-future-property");
            if (id && onDropFromProposals) {
              onDropFromProposals(id);
            }
          }}
        >
          {properties.map((p) => {
            const lvr = lvrRates[p.id] ?? 0.8;
            const equity = Math.max(0, (p.estimatedValue * lvr) - p.loanBalance);
            const futureValue = Math.round(p.estimatedValue * Math.pow(1 + growthRate / 100, yearsToTarget));
            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-existing-property", p.id);
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
                style={{ width: "calc((100% - 36px) / 4)", minWidth: "200px", scrollSnapAlign: "start" }}
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
                  <p className="font-semibold text-sm text-foreground truncate">{p.nickname || "Untitled"}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                  <div>
                    <label className="text-muted-foreground text-[10px]">Current Value</label>
                    <p className="text-foreground font-medium">${p.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <label className="text-muted-foreground text-[10px]">Current Loan</label>
                      {p.loan.interestOnlyPeriodYears === 0 && (
                        <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-destructive/10 border border-destructive/20">
                          <AlertTriangle size={8} className="text-destructive shrink-0" />
                          <span className="text-[8px] text-destructive font-medium leading-none">Update</span>
                        </div>
                      )}
                    </div>
                    <p className="text-foreground font-medium">${p.loanBalance.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[10px]">{"Future Value (" + growthRate + "%)"}</label>
                    <p className="text-accent font-medium">${futureValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      <label className="text-muted-foreground text-[10px]">Equity Avail.</label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info size={10} className="text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="text-xs">(Current Value × LVR) − Loan Balance</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-accent font-bold">${equity.toLocaleString()}</span>
                      {equity > 150000 && (
                        <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                          Go again
                        </span>
                      )}
                      <select
                        value={lvr}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setLvrRates({ ...lvrRates, [p.id]: Number(e.target.value) });
                        }}
                        className="py-1 px-2 rounded-md border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.88}>88%</option>
                        <option value={0.9}>90%</option>
                        
                      </select>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="mt-auto pt-2 border-t border-border flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                    {p.ownership === "trust" ? "Trust" : "Personal"}
                  </span>
                  {p.earmarked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      Sell down
                    </span>
                  )}
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
            style={{ width: "calc((100% - 36px) / 4)", minWidth: "200px", scrollSnapAlign: "start" }}
          >
            <Plus size={24} />
            <span className="text-sm">Add Property</span>
          </button>

          {/* Empty placeholder slots to fill up to 5 */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <button
              key={`empty-${i}`}
              onClick={addProperty}
              className="rounded-xl border-2 border-dashed border-border/30 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent/40 hover:bg-accent/5 transition-all font-medium text-muted-foreground/40 shrink-0"
              style={{ width: "calc((100% - 36px) / 4)", minWidth: "200px", scrollSnapAlign: "start" }}
            >
              <Plus size={20} />
            </button>
          ))}
        </div>

        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedId}
          onOpenChange={(o) => {
            if (!o) {
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
          growthRate={growthRate}
        />
      </section>
    </TooltipProvider>
  );
};

export default ExistingProperties;
