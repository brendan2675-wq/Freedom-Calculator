import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, ChevronRight, ChevronLeft, Info, AlertTriangle, Briefcase, BadgeDollarSign, Home } from "lucide-react";
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
  portfolioMode?: boolean;
  ppor?: ExistingProperty | null;
  onAddPpor?: () => void;
  onUpdatePpor?: (p: ExistingProperty) => void;
  onRemovePpor?: () => void;
  pporLvr?: number;
  onPporLvrChange?: (lvr: number) => void;
}

const VISIBLE_SLOTS = 4;

const ExistingProperties = ({ properties, setProperties, targetMonth, targetYear, growthRate, onMoveToProposals, onDropFromProposals, portfolioMode = false, ppor, onAddPpor, onUpdatePpor, onRemovePpor, pporLvr = 0.8, onPporLvrChange }: Props) => {
  const [pporSheetOpen, setPporSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lvrRates, setLvrRates] = useState<Record<string, number>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [masterSellYear, setMasterSellYear] = useState(0);
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
    if (draggingId && !properties.find((p) => p.id === draggingId)) {
      setDraggingId(null);
    }
  }, [properties, updateScrollState, draggingId]);
  const allEarmarked = properties.length > 0 && properties.every((p) => p.earmarked);

  const showSellDownReminder = () => {
    const count = parseInt(localStorage.getItem("sell-down-reminder-count") || "0", 10);
    if (count < 5) {
      toast("📝 Have you entered in all details of the sale e.g. stamp duty, selling fees etc?", { duration: 5000, dismissible: true });
      localStorage.setItem("sell-down-reminder-count", String(count + 1));
    }
  };

  const handleMasterSellDown = () => {
    if (!allEarmarked) showSellDownReminder();
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
  const totalItems = properties.length + 1 + emptySlots;
  const showArrows = totalItems > VISIBLE_SLOTS || properties.length >= VISIBLE_SLOTS;
  const hasOverflow = properties.length >= VISIBLE_SLOTS;
  const cardWidth = hasOverflow ? "calc((100% - 36px) / 4.3)" : "calc((100% - 36px) / 4)";

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
            {portfolioMode ? "Your Properties" : "Your Investment Portfolio"}
            {properties.length > VISIBLE_SLOTS && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {properties.length} properties
              </span>
            )}
          </h2>
          {!portfolioMode && (
            <div className="flex items-center gap-2">
              {properties.length > 0 && (
                allEarmarked ? (
                  <button
                    onClick={handleMasterSellDown}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium transition-colors"
                  >
                    <X size={14} />
                    Selling {masterSellYear === 0 ? "Now" : `in ${masterSellYear} ${masterSellYear === 1 ? "yr" : "yrs"}`}
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-md border border-accent/30 bg-accent/10 text-accent text-xs font-medium whitespace-nowrap"
                  >
                    <BadgeDollarSign size={14} className="shrink-0 cursor-pointer" onClick={handleMasterSellDown} />
                    <span className="cursor-pointer" onClick={handleMasterSellDown}>Sell All in</span>
                    <select
                      value={masterSellYear}
                      onChange={(e) => setMasterSellYear(Number(e.target.value))}
                      className="py-1 px-1.5 rounded border border-accent/30 bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                    >
                      <option value={0}>Now</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i + 1 === 1 ? "yr" : "yrs"}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleMasterSellDown}
                      className="ml-0.5 px-2 py-1 rounded bg-accent text-accent-foreground text-xs font-semibold hover:bg-accent/90 transition-colors"
                    >
                      Go
                    </button>
                  </div>
                )
              )}
            </div>
          )}
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
            className={`flex gap-3 overflow-x-auto ${properties.length > 4 ? "scrollbar-thin" : "scrollbar-hide"} pb-2 rounded-xl transition-colors ${dragOver ? "bg-accent/10 ring-2 ring-accent/40" : ""}`}
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
            const purchaseDate = p.purchase?.purchaseDate;
            const purchaseStartDate = purchaseDate ? new Date(purchaseDate) : new Date();
            const growthStartDelay = Math.max(0, (purchaseStartDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            const effectiveGrowthYears = Math.max(0, yearsToTarget - growthStartDelay);
            const futureValue = Math.round(p.estimatedValue * Math.pow(1 + growthRate / 100, effectiveGrowthYears));
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
                  <p className="font-semibold text-sm text-foreground truncate">{p.nickname || "Untitled"}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                  <div>
                    <label className="text-muted-foreground text-[11px]">Current Value</label>
                    <p className="text-foreground font-medium">${p.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-[11px]">Current Loan</label>
                    <p className="text-foreground font-medium">${p.loanBalance.toLocaleString()}</p>
                  </div>
                  {!portfolioMode && (
                    <div>
                      <label className="text-muted-foreground text-[11px]">{"Future Value (" + growthRate + "%)"}</label>
                      <p className="text-accent font-medium">${futureValue.toLocaleString()}</p>
                    </div>
                  )}
                  {portfolioMode && p.rental.weeklyRent > 0 && p.estimatedValue > 0 && (
                    <div>
                      <label className="text-muted-foreground text-[11px]">Rental Yield</label>
                      <p className="text-accent font-medium">
                        {((p.rental.weeklyRent * 52) / p.estimatedValue * 100).toFixed(1)}%
                        <span className="text-muted-foreground text-[10px] ml-1">
                          (${(p.rental.weeklyRent * 52).toLocaleString()} p.a.)
                        </span>
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-muted-foreground text-[11px]">Equity Available</label>
                    <div className="flex items-center gap-1">
                      <span className={`font-bold ${equity > 50000 ? 'text-success' : 'text-accent'}`}>${equity.toLocaleString()}</span>
                      <select
                        value={lvr}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          setLvrRates({ ...lvrRates, [p.id]: Number(e.target.value) });
                        }}
                        className="py-0.5 px-1 rounded border border-border bg-background text-foreground text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                      >
                        <option value={0.8}>80%</option>
                        <option value={0.88}>88%</option>
                        <option value={0.9}>90%</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Missing purchase price warning */}
                {p.earmarked && (!p.purchase.purchasePrice || p.purchase.purchasePrice <= 0) && (
                  <div className="mt-3 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-semibold text-destructive">Purchase price required</p>
                      <p className="text-[10px] text-muted-foreground">Enter the original purchase price to calculate sell-down proceeds.</p>
                    </div>
                  </div>
                )}

                {/* Badges & Sell Down */}
                <div className="mt-4 pt-2 border-t border-border/70 flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                      {p.ownership === "trust" ? (p.trustName || "Trust") : "Personal"}
                    </span>
                  </div>
                  {!portfolioMode && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {p.earmarked ? (
                        <div className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                          <span>Selling in</span>
                          <select
                            value={p.sellInYears ?? 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, sellInYears: Number(e.target.value) } : prop));
                            }}
                            className="py-0.5 px-1 rounded border border-destructive/30 bg-background text-foreground text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-destructive cursor-pointer"
                          >
                            <option value={0}>Now</option>
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} {i + 1 === 1 ? "yr" : "yrs"}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, earmarked: false, sellInYears: 0 } : prop))}
                            className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          <BadgeDollarSign size={10} className="shrink-0" />
                          <span>Sell in</span>
                          <select
                            value={p.sellInYears ?? 0}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, sellInYears: Number(e.target.value) } : prop));
                            }}
                            className="py-0.5 px-1 rounded border border-accent/30 bg-background text-foreground text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer"
                          >
                            <option value={0}>Now</option>
                            {Array.from({ length: 10 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {i + 1} {i + 1 === 1 ? "yr" : "yrs"}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              showSellDownReminder();
                              setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, earmarked: true } : prop));
                            }}
                            className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px] font-semibold hover:bg-accent/90 transition-colors"
                          >
                            Go
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {/* Primary Add Property button */}
          <button
            onClick={addProperty}
            className="rounded-xl border-2 border-dashed border-accent/40 p-4 flex flex-col items-center justify-center gap-2 hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent shrink-0"
            style={{ width: cardWidth, minWidth: "200px", scrollSnapAlign: "start" }}
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
              if (selectedProperty && !selectedProperty.nickname && selectedProperty.estimatedValue === 0) {
                setProperties(properties.filter((p) => p.id !== selectedId));
              }
              setSelectedId(null);
            }
          }}
          onUpdate={(updated) => {
            setProperties(properties.map((p) => p.id === updated.id ? updated as ExistingProperty : p));
          }}
          onDuplicate={(prop) => {
            const dup = { ...prop, id: crypto.randomUUID(), nickname: `${(prop as ExistingProperty).nickname || "Property"} (copy)` } as ExistingProperty;
            setProperties([...properties, dup]);
            setSelectedId(dup.id);
          }}
          variant="existing"
          growthRate={growthRate}
          portfolioMode={portfolioMode}
        />
      </section>
    </TooltipProvider>
  );
};

export default ExistingProperties;
