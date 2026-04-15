import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Home, Info, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ExistingProperty, LoanSplit } from "@/types/property";

interface PporDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ppor: ExistingProperty;
  setPpor: (p: ExistingProperty) => void;
  suburb: string;
  setSuburb: (v: string) => void;
  loanBalance: number;
  setLoanBalance: (v: number) => void;
  interestRate: number;
  pporValue: number;
  setPporValue: (v: number) => void;
}

const PporDetailSheet = ({
  open,
  onOpenChange,
  ppor,
  setPpor,
  suburb,
  setSuburb,
  loanBalance,
  setLoanBalance,
  interestRate,
  pporValue,
  setPporValue,
}: PporDetailSheetProps) => {
  const [highlightFirstSplit, setHighlightFirstSplit] = useState(false);
  const firstAmtRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (highlightFirstSplit && firstAmtRef.current) {
      firstAmtRef.current.focus();
      const valueLength = firstAmtRef.current.value.length;
      firstAmtRef.current.setSelectionRange(valueLength, valueLength);
      const timer = setTimeout(() => setHighlightFirstSplit(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightFirstSplit, ppor.loanSplits]);
  const totalLoanBalance = ppor.loanSplits?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
  const [startingBalance, setStartingBalanceState] = useState(() => {
    const stored = localStorage.getItem("ppor-starting-balance");
    const parsed = stored ? parseInt(stored, 10) : 0;
    return parsed > 0 ? parsed : (totalLoanBalance || loanBalance);
  });
  const setStartingBalance = (v: number) => {
    setStartingBalanceState(v);
    localStorage.setItem("ppor-starting-balance", String(v));
  };

  const [purchasePrice, setPurchasePrice] = useState(() => {
    return ppor.purchase?.purchasePrice || 0;
  });

  const currentValue = pporValue;
  const growthPercent = useMemo(() => {
    if (purchasePrice <= 0) return 0;
    return ((currentValue - purchasePrice) / purchasePrice) * 100;
  }, [currentValue, purchasePrice]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Home size={20} className="text-accent" />
            <SheetTitle className="text-xl">Your Home (PPOR)</SheetTitle>
          </div>
        </SheetHeader>

        <div className="space-y-8 pt-6">
          {/* Section 1: Property Details */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Property Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Suburb</label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="e.g. Paddington"
                  className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 2: Loan Details */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Loan Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Current Loan Balance</label>
                {(ppor.loanSplits || []).length === 0 ? (
                  <button
                    onClick={() => {
                      const newSplit: LoanSplit = { id: crypto.randomUUID(), label: suburb || "Primary Loan", amount: loanBalance, interestRate, loanTermYears: 30, interestOnlyPeriodYears: 0, offsetBalance: 0 };
                      setPpor({ ...ppor, loanSplits: [newSplit] });
                    }}
                    className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-accent/50 bg-accent/5 text-foreground text-sm font-medium hover:border-accent hover:bg-accent/10 transition-all cursor-pointer group"
                  >
                    <span className="text-muted-foreground">$</span>
                    <span>{loanBalance.toLocaleString()}</span>
                    <span className="ml-auto text-[10px] text-accent font-normal group-hover:underline">Click to set up loan details →</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setHighlightFirstSplit(true)}
                    className="w-full flex items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium cursor-pointer hover:border-accent/50 transition-all group"
                  >
                    <span className="text-muted-foreground">$</span>
                    <span>{loanBalance.toLocaleString()}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-accent transition-colors">Edit in splits below ↓</span>
                  </button>
                )}
                {(ppor.loanSplits || []).length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Auto-calculated from loan splits below</p>
                )}
              </div>

              {/* Loan Splits */}
              <div className="pl-2 border-l-2 border-accent/20 space-y-2 [&_input]:py-1 [&_input]:px-1 [&_input]:text-[10px] [&_input]:rounded [&_input]:rounded-lg-none">
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="text-xs text-muted-foreground font-medium flex items-center gap-1 cursor-help">
                        Loan Details
                        <Info size={10} className="text-muted-foreground" />
                      </label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      Enter loan splits by using the "+" symbol
                    </TooltipContent>
                  </Tooltip>
                  <button
                    onClick={() => {
                      const splits = ppor.loanSplits || [];
                      const defaultLabel = splits.length === 0 ? (suburb || `Split 1`) : `Split ${splits.length + 1}`;
                      const newSplit: LoanSplit = { id: crypto.randomUUID(), label: defaultLabel, amount: 0, interestRate, loanTermYears: 30, interestOnlyPeriodYears: 0, offsetBalance: 0 };
                      setPpor({ ...ppor, loanSplits: [...splits, newSplit] });
                    }}
                    className="text-accent hover:text-accent/80 transition-colors p-0.5"
                  >
                    <Plus size={16} />
                  </button>
                </div>
{/* Empty state CTA is now in the Current Loan Balance field above */}
                {(ppor.loanSplits || []).length > 0 && (
                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-medium">
                    <span className="flex-[2] min-w-0">Label</span>
                    <span className="flex-[2] min-w-0">Amt ($)</span>
                    <span className="flex-[1.2] min-w-0">Rate (%)</span>
                    <span className="flex-[1] min-w-0">IO</span>
                    <span className="flex-[1.2] min-w-0">Term (yr)</span>
                    <span className="flex-[2] min-w-0">Offset ($)</span>
                    <span className="w-4" />
                  </div>
                )}
                {(ppor.loanSplits || []).map((split, idx) => {
                  const updateSplit = (patch: Partial<LoanSplit>, recalcTotal = false) => {
                    const splits = [...(ppor.loanSplits || [])];
                    splits[idx] = { ...splits[idx], ...patch };
                    const updated: Partial<ExistingProperty> = { loanSplits: splits };
                    if (recalcTotal) {
                      const total = splits.reduce((s, sp) => s + sp.amount, 0);
                      updated.loanBalance = total;
                      setLoanBalance(total);
                    }
                    setPpor({ ...ppor, ...updated });
                  };
                  return (
                    <div key={split.id} className="flex items-center gap-1">
                      <input
                        value={split.label}
                        onChange={(e) => updateSplit({ label: e.target.value })}
                        className="flex-[2] min-w-0 py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Label"
                      />
                      <div className="flex-[2] min-w-0">
                        <input
                          ref={idx === 0 ? firstAmtRef : undefined}
                          inputMode="numeric"
                          value={split.amount || ""}
                          onChange={(e) => updateSplit({ amount: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 }, true)}
                          className={`w-full py-1 px-1 rounded border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent transition-all ${idx === 0 && highlightFirstSplit ? "border-destructive ring-2 ring-destructive/30" : "border-border"}`}
                          placeholder="0"
                        />
                      </div>
                      <div className="flex-[1.2] min-w-0">
                        <input
                          inputMode="decimal"
                          value={split.interestRate ?? interestRate}
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (raw === '' || /^\d*\.?\d*$/.test(raw)) updateSplit({ interestRate: parseFloat(raw) || 0 });
                          }}
                          onBlur={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            updateSplit({ interestRate: parseFloat(val.toFixed(2)) });
                          }}
                          className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="flex-[1] min-w-0">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={split.interestOnlyPeriodYears ?? 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            updateSplit({ interestOnlyPeriodYears: Math.min(99, Math.max(0, val)) });
                          }}
                          className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div className="flex-[1.2] min-w-0">
                        <input
                          type="number"
                          min={1}
                          value={split.loanTermYears ?? 30}
                          onChange={(e) => updateSplit({ loanTermYears: parseInt(e.target.value) || 0 })}
                          className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <div className="flex-[2] min-w-0">
                        <input
                          inputMode="numeric"
                          value={split.offsetBalance ?? 0}
                          onChange={(e) => updateSplit({ offsetBalance: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                          className="w-full py-1 px-1 rounded border border-border bg-background text-foreground text-[10px] focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const splits = (ppor.loanSplits || []).filter((_, i) => i !== idx);
                          const total = splits.reduce((s, sp) => s + sp.amount, 0);
                          setLoanBalance(total);
                          setPpor({ ...ppor, loanSplits: splits, loanBalance: total });
                        }}
                        className="w-4 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
                {(ppor.loanSplits || []).length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Total: <span className="font-semibold text-foreground">${(ppor.loanSplits || []).reduce((s, sp) => s + sp.amount, 0).toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 3: Original Loan Amount */}
          <div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Original Loan Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={startingBalance.toLocaleString()}
                    onChange={(e) => setStartingBalance(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 4: Valuation */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Valuation</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Purchase Price</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={purchasePrice ? purchasePrice.toLocaleString() : ""}
                    onChange={(e) => {
                      const v = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                      setPurchasePrice(v);
                      setPpor({ ...ppor, purchase: { ...ppor.purchase, purchasePrice: v } });
                    }}
                    placeholder="Enter purchase price"
                    className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1">Current Value</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentValue ? currentValue.toLocaleString() : ""}
                    onChange={(e) => setPporValue(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                    className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                  />
                </div>
                {purchasePrice > 0 && (
                  <p className={`text-xs font-medium mt-1 ${growthPercent >= 0 ? "text-success" : "text-destructive"}`}>
                    {growthPercent >= 0 ? "↑" : "↓"} {Math.abs(growthPercent).toFixed(1)}% since purchase (${(currentValue - purchasePrice).toLocaleString()})
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PporDetailSheet;
