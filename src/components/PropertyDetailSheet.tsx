import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import OwnershipToggle from "@/components/OwnershipToggle";
import { InvestmentTypeIcon, investmentTypes, getInvestmentTypeLabel } from "@/components/InvestmentTypeIcon";
import type { ExistingProperty, FutureProperty, LoanDetails, RentalDetails, PurchaseDetails, InvestmentType, LoanSplit, SaleCosts } from "@/types/property";
import { defaultSaleCosts } from "@/types/property";
import { calculateStampDuty, australianStates, type AustralianState } from "@/lib/stampDuty";
import { format } from "date-fns";
import { CalendarIcon, Plus, X, AlertTriangle, Copy, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AddressSearchInput from "@/components/AddressSearchInput";

type PropertyType = ExistingProperty | FutureProperty;

interface Props {
  property: PropertyType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: PropertyType) => void;
  onDuplicate?: (property: PropertyType) => void;
  variant: "existing" | "future";
  growthRate?: number;
  portfolioMode?: boolean;
  pporMode?: boolean;
  targetMonth?: number;
  targetYear?: number;
}

const currencyFormat = (v: number) => v.toLocaleString();
const parseCurrency = (v: string) => parseInt(v.replace(/[^0-9]/g, "")) || 0;

function FieldGroup({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div>
      <label className={cn("text-muted-foreground font-medium", compact ? "text-[10px]" : "text-xs")}>{label}</label>
      <div className={compact ? "mt-0.5" : "mt-1"}>{children}</div>
    </div>
  );
}

function CurrencyInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground text-sm">$</span>
      <input
        inputMode="numeric"
        value={value ? currencyFormat(value) : ""}
        onChange={(e) => onChange(parseCurrency(e.target.value))}
        placeholder={placeholder}
        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
      />
    </div>
  );
}

function NumberInput({ value, onChange, suffix, placeholder, inputRef, inputClassName }: { value: number; onChange: (v: number) => void; suffix?: string; placeholder?: string; inputRef?: React.Ref<HTMLInputElement>; inputClassName?: string }) {
  const [raw, setRaw] = useState<string>(value ? String(value) : "");
  const rawRef = useRef(raw);
  rawRef.current = raw;

  useEffect(() => {
    const parsed = parseFloat(rawRef.current);
    if (isNaN(parsed) || parsed !== value) {
      setRaw(value ? String(value) : "");
    }
  }, [value]);

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        inputMode="decimal"
        value={raw}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || /^[0-9]*\.?[0-9]*$/.test(v)) {
            setRaw(v);
            const parsed = parseFloat(v);
            if (!isNaN(parsed)) onChange(parsed);
            else if (v === "") onChange(0);
          }
        }}
        placeholder={placeholder}
        className={inputClassName || "w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"}
      />
      {suffix && <span className="text-muted-foreground text-sm shrink-0">{suffix}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, autoFocus }: { value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
    />
  );
}

function DateInput({ value, onChange, placeholder, minDate }: { value: string; onChange: (v: string) => void; placeholder?: string; minDate?: Date }) {
  const date = value ? new Date(value) : undefined;
  const [textValue, setTextValue] = React.useState(date ? format(date, "dd/MM/yyyy") : "");
  const [calMonth, setCalMonth] = React.useState<Date>(date || new Date());

  React.useEffect(() => {
    if (date) {
      setTextValue(format(date, "dd/MM/yyyy"));
      setCalMonth(date);
    }
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setTextValue(v);
    const match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      if (!isNaN(parsed.getTime()) && (!minDate || parsed >= minDate)) {
        onChange(parsed.toISOString());
        setCalMonth(parsed);
      }
    }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => currentYear - 20 + i);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal text-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder || "Pick a date"}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-2">
          <Input
            placeholder="dd/mm/yyyy"
            value={textValue}
            onChange={handleTextChange}
            className="text-sm h-8"
          />
          <div className="flex gap-1">
            <select
              value={calMonth.getMonth()}
              onChange={(e) => setCalMonth(new Date(calMonth.getFullYear(), Number(e.target.value), 1))}
              className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={calMonth.getFullYear()}
              onChange={(e) => setCalMonth(new Date(Number(e.target.value), calMonth.getMonth(), 1))}
              className="flex-1 h-8 text-xs rounded-md border border-input bg-background px-2"
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <Calendar
          mode="single"
          month={calMonth}
          onMonthChange={setCalMonth}
          selected={date}
          disabled={minDate ? (d) => d < minDate : undefined}
          onSelect={(d) => {
            onChange(d ? d.toISOString() : "");
            if (d) setTextValue(format(d, "dd/MM/yyyy"));
          }}
          className={cn("p-3 pt-0 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{title}</h3>
      <Separator className="mt-2" />
    </div>
  );
}

const PropertyDetailSheet = ({ property, open, onOpenChange, onUpdate, onDuplicate, variant, growthRate = 6.5, portfolioMode = false, pporMode = false, targetMonth, targetYear }: Props) => {
  const isExisting = variant === "existing";
  const manualTaxOverride = useRef(false);

  // Compute fractional years to sell date, matching the card's Future Value logic
  const getFractionalSellYears = (sellInYears: number, purchaseDateStr?: string) => {
    const now = new Date();
    // Use target date if available and sellInYears aligns, otherwise use sellInYears from now
    if (targetYear && targetMonth) {
      const target = new Date(targetYear, targetMonth - 1);
      const yearsToTarget = Math.max(0, (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
      // Use fractional yearsToTarget when sellInYears matches the rounded value
      const fractionalYears = Math.abs(yearsToTarget - sellInYears) < 0.5 ? yearsToTarget : sellInYears;
      const purchaseStart = purchaseDateStr ? new Date(purchaseDateStr) : null;
      const purchaseDelayYears = purchaseStart && purchaseStart > now
        ? (purchaseStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        : 0;
      return Math.max(0, fractionalYears - purchaseDelayYears);
    }
    return sellInYears;
  };
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
  }, [highlightFirstSplit, (property as ExistingProperty)?.loanSplits]);

  useEffect(() => {
    manualTaxOverride.current = false;
  }, [property?.id]);

  // Auto-suggest tax rate only when earmarked is toggled or purchase price changes, not on every property update
  const prevEarmarkedRef = useRef<boolean | null>(null);
  const prevPurchasePriceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!property || !isExisting || manualTaxOverride.current) return;
    const ep = property as ExistingProperty;
    if (!ep.earmarked) {
      prevEarmarkedRef.current = false;
      return;
    }
    const purchasePrice = ep.purchase.purchasePrice || 0;
    // Only auto-suggest when earmarked changes to true or purchase price changes
    const earmarkedChanged = prevEarmarkedRef.current !== ep.earmarked;
    const priceChanged = prevPurchasePriceRef.current !== null && prevPurchasePriceRef.current !== purchasePrice;
    prevEarmarkedRef.current = ep.earmarked;
    prevPurchasePriceRef.current = purchasePrice;

    if (!earmarkedChanged && !priceChanged) return;
    if (!purchasePrice) return;

    const sc = ep.saleCosts || { ...defaultSaleCosts };
    const autoStampDuty = ep.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, ep.state, ep.purchase.purchaseDate || undefined) : 0;
    const stampDutyAcq = sc.stampDutyOnPurchase != null && sc.stampDutyOnPurchase > 0 ? sc.stampDutyOnPurchase : autoStampDuty;
    const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
    const totalImprovements = sc.renovations + sc.structuralWork;
    const totalOwnership = sc.ownershipCostsTotal;
    const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
    const costBase = totalAcquisition + totalImprovements + totalOwnership + totalSelling;
    const capitalGain = Math.max(0, ep.estimatedValue - costBase);
    const discountedGain = capitalGain * (1 - sc.cgtDiscount);

    // Only auto-suggest tax rate if saleCosts hasn't been set yet (first time)
    if (ep.saleCosts) return;

    // Suggested marginal rate INCLUDES 2% Medicare levy for individuals
    let suggestedRate = 0.47;
    if (discountedGain > 190000) suggestedRate = 0.47;
    else if (discountedGain > 135000) suggestedRate = 0.39;
    else if (discountedGain > 45000) suggestedRate = 0.32;
    else if (discountedGain > 18200) suggestedRate = 0.18;
    else suggestedRate = 0.47;

    if (sc.incomeTaxRate !== suggestedRate) {
      onUpdate({ ...property, saleCosts: { ...sc, incomeTaxRate: suggestedRate, includeMedicareLevy: false } } as ExistingProperty);
    }
  }, [isExisting, property, onUpdate]);

  if (!property) return null;

  const update = (fields: Partial<PropertyType>) => {
    onUpdate({ ...property, ...fields } as PropertyType);
  };

  const updateLoan = (fields: Partial<LoanDetails>) => {
    update({ loan: { ...property.loan, ...fields } });
  };

  const updateRental = (fields: Partial<RentalDetails>) => {
    update({ rental: { ...property.rental, ...fields } });
  };

  const updatePurchase = (fields: Partial<PurchaseDetails>) => {
    const updated = { ...property.purchase, ...fields };
    // If purchase date changed and settlement date is before it, clear settlement
    if (fields.purchaseDate && updated.settlementDate) {
      const pd = new Date(fields.purchaseDate);
      const sd = new Date(updated.settlementDate);
      if (sd < pd) {
        updated.settlementDate = "";
      }
    }
    update({ purchase: updated });
  };

  const title = isExisting
    ? (property as ExistingProperty).nickname || "Property Details"
    : (property as FutureProperty).suburb || "Property Details";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card">
        <SheetHeader>
          <SheetTitle className="text-xl">{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-8">
          {/* Basic Info */}
          <div className="flex items-center justify-between">
            <SectionHeader title="Basic Info" />
            {onDuplicate && !pporMode && (
              <button
                onClick={() => {
                  onDuplicate(property);
                  onOpenChange(false);
                }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
                title="Duplicate property"
              >
                <Copy size={14} />
                <span>Duplicate</span>
              </button>
            )}
          </div>
          <div className="space-y-4">
            {isExisting ? (
              <>
                <FieldGroup label="Property Nickname">
                  <TextInput
                    value={(property as ExistingProperty).nickname}
                    onChange={(v) => update({ nickname: v } as Partial<ExistingProperty>)}
                    placeholder="e.g. Parramatta Unit"
                  />
                </FieldGroup>
                <FieldGroup label="Full Address (Optional)">
                  <AddressSearchInput
                    value={(property as ExistingProperty).address || ""}
                    onChange={(v) => update({ address: v } as Partial<ExistingProperty>)}
                    placeholder="Search address or enter manually"
                    className="h-10 text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Estimated Value">
                  <CurrencyInput
                    value={(property as ExistingProperty).estimatedValue}
                    onChange={(v) => update({ estimatedValue: v } as Partial<ExistingProperty>)}
                  />
                </FieldGroup>
                <FieldGroup label="Current Loan Balance">
                  {((property as ExistingProperty).loanSplits || []).length === 0 ? (
                    <button
                      onClick={() => {
                        const ep = property as ExistingProperty;
                        const newSplit: LoanSplit = { id: crypto.randomUUID(), label: ep.nickname || "Primary Loan", amount: ep.loanBalance, interestRate: property.loan.interestRate, loanTermYears: property.loan.loanTermYears, interestOnlyPeriodYears: property.loan.interestOnlyPeriodYears, offsetBalance: property.loan.offsetBalance };
                        update({ loanSplits: [newSplit] } as Partial<ExistingProperty>);
                      }}
                      className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-accent/50 bg-accent/5 text-foreground text-sm font-medium hover:border-accent hover:bg-accent/10 transition-all cursor-pointer group"
                    >
                      <span className="text-muted-foreground">$</span>
                      <span>{(property as ExistingProperty).loanBalance.toLocaleString()}</span>
                      <span className="ml-auto text-[10px] text-accent font-normal group-hover:underline">Click to set up loan details →</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setHighlightFirstSplit(true)}
                      className="w-full flex items-center gap-1 py-2 px-3 rounded-lg border border-border bg-muted/30 text-foreground text-sm font-medium cursor-pointer hover:border-accent/50 transition-all group"
                    >
                      <span className="text-muted-foreground">$</span>
                      <span>{(property as ExistingProperty).loanBalance.toLocaleString()}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-accent transition-colors">Edit in splits below ↓</span>
                    </button>
                  )}
                  {((property as ExistingProperty).loanSplits || []).length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">Auto-calculated from loan splits below</p>
                  )}
                </FieldGroup>

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
                        const ep = property as ExistingProperty;
                        const splits = ep.loanSplits || [];
                        const defaultLabel = splits.length === 0 ? (ep.nickname || `Split 1`) : `Split ${splits.length + 1}`;
                        const newSplit: LoanSplit = { id: crypto.randomUUID(), label: defaultLabel, amount: 0, interestRate: property.loan.interestRate, loanTermYears: property.loan.loanTermYears, interestOnlyPeriodYears: property.loan.interestOnlyPeriodYears, offsetBalance: 0 };
                        update({ loanSplits: [...splits, newSplit] } as Partial<ExistingProperty>);
                      }}
                      className="text-accent hover:text-accent/80 transition-colors p-0.5"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {((property as ExistingProperty).loanSplits || []).length > 0 && (
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
                  {((property as ExistingProperty).loanSplits || []).map((split, idx) => {
                    const updateSplit = (patch: Partial<LoanSplit>, recalcTotal = false) => {
                      const ep = property as ExistingProperty;
                      const splits = [...(ep.loanSplits || [])];
                      splits[idx] = { ...splits[idx], ...patch };
                      const extra: Partial<ExistingProperty> = { loanSplits: splits };
                      if (recalcTotal) extra.loanBalance = splits.reduce((s, sp) => s + sp.amount, 0);
                      update(extra as Partial<ExistingProperty>);
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
                          <NumberInput
                            value={split.amount}
                            onChange={(v) => updateSplit({ amount: v }, true)}
                            inputRef={idx === 0 ? firstAmtRef : undefined}
                            inputClassName={`w-full py-2 px-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm transition-all ${idx === 0 && highlightFirstSplit ? "border-destructive ring-2 ring-destructive/30" : "border-border"}`}
                          />
                        </div>
                        <div className="flex-[1.2] min-w-0">
                          <NumberInput value={split.interestRate ?? property.loan.interestRate} onChange={(v) => updateSplit({ interestRate: v })} />
                        </div>
                        <div className="flex-[1] min-w-0">
                          <NumberInput value={split.interestOnlyPeriodYears ?? property.loan.interestOnlyPeriodYears} onChange={(v) => updateSplit({ interestOnlyPeriodYears: v })} />
                        </div>
                        <div className="flex-[1.2] min-w-0">
                          <NumberInput value={split.loanTermYears ?? property.loan.loanTermYears} onChange={(v) => updateSplit({ loanTermYears: v })} />
                        </div>
                        <div className="flex-[2] min-w-0">
                          <NumberInput value={split.offsetBalance ?? property.loan.offsetBalance} onChange={(v) => updateSplit({ offsetBalance: v })} />
                        </div>
                        <button
                          onClick={() => {
                            const ep = property as ExistingProperty;
                            const splits = (ep.loanSplits || []).filter((_, i) => i !== idx);
                            const total = splits.reduce((s, sp) => s + sp.amount, 0);
                            update({ loanSplits: splits, loanBalance: total } as Partial<ExistingProperty>);
                          }}
                          className="w-4 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                  {((property as ExistingProperty).loanSplits || []).length > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">${((property as ExistingProperty).loanSplits || []).reduce((s, sp) => s + sp.amount, 0).toLocaleString()}</span>
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                {!(property as FutureProperty).suburb && (property as FutureProperty).purchasePrice === 0 && (
                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-1">
                    <p className="text-sm font-semibold text-accent">Enter property details</p>
                    <p className="text-xs text-muted-foreground">Fill in the suburb and purchase price to get started.</p>
                  </div>
                )}
                <FieldGroup label="Property Nickname">
                  <TextInput
                    value={(property as FutureProperty).nickname || (property as FutureProperty).suburb}
                    onChange={(v) => update({ nickname: v, suburb: v } as Partial<FutureProperty>)}
                    placeholder="e.g. Geelong townhouse"
                    autoFocus={!(property as FutureProperty).suburb}
                  />
                </FieldGroup>
                <FieldGroup label="Full Address (Optional)">
                  <AddressSearchInput
                    value={(property as FutureProperty).address || ""}
                    onChange={(v) => update({ address: v } as Partial<FutureProperty>)}
                    placeholder="Search address if known"
                    className="h-10 text-sm"
                  />
                </FieldGroup>
                <FieldGroup label="Purchase Price">
                  <CurrencyInput
                    value={(property as FutureProperty).purchasePrice}
                    onChange={(v) => {
                      const fp = property as FutureProperty;
                      const weeklyRent = property.rental.weeklyRent;
                      const annualRent = weeklyRent * 52;
                      const yieldPct = v > 0 ? parseFloat(((annualRent / v) * 100).toFixed(2)) : 0;
                      // Recalculate stamp duty if state is selected
                      const sc = fp.saleCosts || { ...defaultSaleCosts };
                      const purchaseDate = fp.purchase?.purchaseDate || undefined;
                      const newDuty = fp.state && v > 0 ? calculateStampDuty(v, fp.state, purchaseDate) : 0;
                      update({ purchasePrice: v, rentalYield: yieldPct, saleCosts: { ...sc, stampDutyOnPurchase: newDuty } } as Partial<FutureProperty>);
                    }}
                  />
                </FieldGroup>
              </>
            )}
            {!pporMode && (
              <FieldGroup label="Investment Type">
                <div className="grid grid-cols-4 gap-2">
                  {investmentTypes.map((t) => (
                    <button
                      key={t}
                      onClick={() => update({ investmentType: t })}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border text-sm font-medium transition-all",
                        property.investmentType === t
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                      )}
                    >
                      <InvestmentTypeIcon type={t} size={20} />
                      <span className="text-xs">{getInvestmentTypeLabel(t)}</span>
                    </button>
                  ))}
                </div>
              </FieldGroup>
            )}
            {!pporMode && (
              <FieldGroup label="Ownership Structure">
                <OwnershipToggle value={property.ownership} onChange={(v) => update({ ownership: v })} trustName={property.trustName || ""} onTrustNameChange={(name) => update({ trustName: name })} />
              </FieldGroup>
            )}
            {!isExisting && (
              <FieldGroup label="Purchase Date *">
                <DateInput value={property.purchase.purchaseDate} onChange={(v) => updatePurchase({ purchaseDate: v })} placeholder="Select purchase date" minDate={new Date(new Date().setHours(0,0,0,0))} />
                {!property.purchase.purchaseDate && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">Purchase date is required for accurate projections</p>
                )}
              </FieldGroup>
            )}
            {!isExisting && (() => {
              const fp = property as FutureProperty;
              const sc = fp.saleCosts || { ...defaultSaleCosts };
              const purchasePrice = fp.purchasePrice || 0;
              const purchaseDate = fp.purchase?.purchaseDate || undefined;
              const autoStampDuty = fp.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, fp.state, purchaseDate) : 0;
              const stampDutyAcq = sc.stampDutyOnPurchase != null && sc.stampDutyOnPurchase > 0 ? sc.stampDutyOnPurchase : autoStampDuty;
              const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;

              const updateFutureSaleCosts = (fields: Partial<SaleCosts>) => {
                update({ saleCosts: { ...sc, ...fields } } as Partial<FutureProperty>);
              };

              const hasEmptyAcquisition = !purchasePrice && !sc.stampDutyOnPurchase && !sc.legalFeesBuy && !sc.buyersAgentFees && !sc.buildingPestFees && !sc.mortgageEstablishmentFees;

              return (
                <div className={cn("bg-muted/30 border rounded-lg p-4 space-y-3", hasEmptyAcquisition ? "border-accent/50" : "border-border")}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Original Acquisition Costs</h4>
                    {hasEmptyAcquisition && (
                      <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">Please complete</span>
                    )}
                  </div>
                  <FieldGroup label="State / Territory">
                    <select
                      value={fp.state || ""}
                      onChange={(e) => {
                        const newState = (e.target.value || undefined) as AustralianState | undefined;
                        const newDuty = newState && purchasePrice > 0 ? calculateStampDuty(purchasePrice, newState, purchaseDate) : 0;
                        update({ state: newState, saleCosts: { ...sc, stampDutyOnPurchase: newDuty } } as Partial<FutureProperty>);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select state...</option>
                      {australianStates.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label={fp.state ? `Stamp Duty (${fp.state}${purchaseDate ? ` · ${new Date(purchaseDate).getFullYear()} rates` : ""})` : "Stamp Duty"}>
                    <CurrencyInput value={stampDutyAcq} onChange={(v) => updateFutureSaleCosts({ stampDutyOnPurchase: v })} />
                  </FieldGroup>
                  <FieldGroup label="Legal / Conveyancing Fees">
                    <CurrencyInput value={sc.legalFeesBuy} onChange={(v) => updateFutureSaleCosts({ legalFeesBuy: v })} />
                  </FieldGroup>
                  <FieldGroup label="Buyer's Agent Fees">
                    <CurrencyInput value={sc.buyersAgentFees} onChange={(v) => updateFutureSaleCosts({ buyersAgentFees: v })} />
                  </FieldGroup>
                  <FieldGroup label="Building & Pest Inspection">
                    <CurrencyInput value={sc.buildingPestFees} onChange={(v) => updateFutureSaleCosts({ buildingPestFees: v })} />
                  </FieldGroup>
                  <FieldGroup label="Mortgage Establishment Fees">
                    <CurrencyInput value={sc.mortgageEstablishmentFees} onChange={(v) => updateFutureSaleCosts({ mortgageEstablishmentFees: v })} />
                  </FieldGroup>
                  <div className="flex justify-between text-xs pt-1 border-t border-border">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">${totalAcquisition.toLocaleString()}</span>
                  </div>
                </div>
              );
            })()}
            {isExisting && (() => {
              const ep = property as ExistingProperty;
              const rawSc = ep.saleCosts || { ...defaultSaleCosts };
              const fractionalSellYears = getFractionalSellYears(ep.sellInYears || 0, ep.purchase?.purchaseDate);
              const projectedSaleValue = Math.round(ep.estimatedValue * Math.pow(1 + (growthRate || 0) / 100, fractionalSellYears));
              const sc = { ...rawSc, agentCommission: rawSc.agentCommission || Math.round(projectedSaleValue * 0.02) };
              const purchasePrice = ep.purchase.purchasePrice || 0;
              const purchaseDate = ep.purchase.purchaseDate || undefined;
              const autoStampDuty = ep.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, ep.state, purchaseDate) : 0;
              const stampDutyAcq = sc.stampDutyOnPurchase != null && sc.stampDutyOnPurchase > 0 ? sc.stampDutyOnPurchase : autoStampDuty;
              const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;

              const updateSaleCosts = (fields: Partial<SaleCosts>) => {
                update({ saleCosts: { ...sc, ...fields } } as Partial<ExistingProperty>);
              };

              const hasEmptyAcquisition = !purchasePrice && !sc.stampDutyOnPurchase && !sc.legalFeesBuy && !sc.buyersAgentFees && !sc.buildingPestFees && !sc.mortgageEstablishmentFees;

              return (
                <>
                  <FieldGroup label="Purchase Date">
                    <DateInput value={property.purchase.purchaseDate} onChange={(v) => updatePurchase({ purchaseDate: v })} placeholder="Select purchase date" />
                  </FieldGroup>
                  {/* Original Acquisition Costs - always visible */}
                  <div className={cn("bg-muted/30 border rounded-lg p-4 space-y-3", hasEmptyAcquisition ? "border-accent/50" : "border-border")}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Original Acquisition Costs</h4>
                      {hasEmptyAcquisition && (
                        <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded">Please complete</span>
                      )}
                    </div>
                    <FieldGroup label="Purchase Price">
                      <CurrencyInput value={purchasePrice} onChange={(v) => {
                        const newDuty = ep.state && v > 0 ? calculateStampDuty(v, ep.state, purchaseDate) : 0;
                        update({ purchase: { ...property.purchase, purchasePrice: v }, saleCosts: { ...sc, stampDutyOnPurchase: newDuty } } as Partial<ExistingProperty>);
                      }} />
                    </FieldGroup>
                    <FieldGroup label="State / Territory">
                      <select
                        value={ep.state || ""}
                        onChange={(e) => {
                          const newState = (e.target.value || undefined) as AustralianState | undefined;
                          const newDuty = newState && purchasePrice > 0 ? calculateStampDuty(purchasePrice, newState, purchaseDate) : 0;
                          update({ state: newState, saleCosts: { ...sc, stampDutyOnPurchase: newDuty } } as Partial<ExistingProperty>);
                        }}
                        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="">Select state...</option>
                        {australianStates.map((s) => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </FieldGroup>
                    <FieldGroup label={ep.state ? `Stamp Duty (${ep.state}${purchaseDate ? ` · ${new Date(purchaseDate).getFullYear()} rates` : ""})` : "Stamp Duty"}>
                      <CurrencyInput value={stampDutyAcq} onChange={(v) => updateSaleCosts({ stampDutyOnPurchase: v })} />
                    </FieldGroup>
                    <FieldGroup label="Legal / Conveyancing Fees">
                      <CurrencyInput value={sc.legalFeesBuy} onChange={(v) => updateSaleCosts({ legalFeesBuy: v })} />
                    </FieldGroup>
                    <FieldGroup label="Buyer's Agent Fees">
                      <CurrencyInput value={sc.buyersAgentFees} onChange={(v) => updateSaleCosts({ buyersAgentFees: v })} />
                    </FieldGroup>
                    <FieldGroup label="Building & Pest Inspection">
                      <CurrencyInput value={sc.buildingPestFees} onChange={(v) => updateSaleCosts({ buildingPestFees: v })} />
                    </FieldGroup>
                    <FieldGroup label="Mortgage Establishment Fees">
                      <CurrencyInput value={sc.mortgageEstablishmentFees} onChange={(v) => updateSaleCosts({ mortgageEstablishmentFees: v })} />
                    </FieldGroup>
                    <div className="flex justify-between text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold text-foreground">${totalAcquisition.toLocaleString()}</span>
                    </div>
                  </div>

                  {!portfolioMode && (<>
                  {/* Sell down toggle */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Switch
                      checked={ep.earmarked}
                      onCheckedChange={(v) => update({ earmarked: v, sellInYears: ep.sellInYears ?? 0 } as Partial<ExistingProperty>)}
                    />
                    <span className="text-sm text-muted-foreground">Sell down this property</span>
                    {ep.earmarked && (
                      <select
                        value={ep.sellInYears ?? 0}
                        onChange={(e) => {
                          const newYears = Number(e.target.value);
                          const fracYears = getFractionalSellYears(newYears, ep.purchase?.purchaseDate);
                          const projectedValue = Math.round(ep.estimatedValue * Math.pow(1 + (growthRate || 0) / 100, fracYears));
                          const newCommission = Math.round(projectedValue * 0.02);
                          const updatedSaleCosts = { ...(ep.saleCosts || defaultSaleCosts), agentCommission: newCommission };
                          update({ sellInYears: newYears, saleCosts: updatedSaleCosts } as Partial<ExistingProperty>);
                        }}
                        className="py-1.5 px-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value={0}>Now</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((yr) => (
                          <option key={yr} value={yr}>In {yr} year{yr > 1 ? "s" : ""}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  {ep.earmarked && !ep.purchase.purchaseDate && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>Enter a <strong>purchase date</strong> and <strong>state</strong> above for accurate stamp duty &amp; CGT calculations</span>
                    </div>
                  )}

                  {/* Sell-down sections - only when earmarked */}
                  {ep.earmarked && (() => {
                    const sellYears = ep.sellInYears ?? 0;
                    const effectiveSellGrowthYears = getFractionalSellYears(sellYears, ep.purchase?.purchaseDate);
                    const currentValue = effectiveSellGrowthYears > 0
                      ? Math.round(ep.estimatedValue * Math.pow(1 + growthRate / 100, effectiveSellGrowthYears))
                      : ep.estimatedValue;
                    const loanBal = ep.loanBalance;
                    const totalImprovements = sc.renovations + sc.structuralWork;
                    const totalOwnership = sc.ownershipCostsTotal;
                    const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
                    const costBase = totalAcquisition + totalImprovements + totalOwnership + totalSelling;
                    const capitalGain = Math.max(0, currentValue - costBase);
                    const saleProceeds = currentValue - loanBal - totalSelling;

                    return (
                      <div className="space-y-4">
                        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Capital Improvements</h4>
                          <FieldGroup label="Renovations">
                            <CurrencyInput value={sc.renovations} onChange={(v) => updateSaleCosts({ renovations: v })} />
                          </FieldGroup>
                          <FieldGroup label="Structural Work">
                            <CurrencyInput value={sc.structuralWork} onChange={(v) => updateSaleCosts({ structuralWork: v })} />
                          </FieldGroup>
                          <div className="flex justify-between text-xs pt-1 border-t border-border">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold text-foreground">${totalImprovements.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Selling Costs</h4>
                          <FieldGroup label="Real Estate Agent Commission">
                            <CurrencyInput value={sc.agentCommission} onChange={(v) => updateSaleCosts({ agentCommission: v })} />
                          </FieldGroup>
                          <FieldGroup label="Legal / Conveyancing Fees (Sale)">
                            <CurrencyInput value={sc.legalFeesSell} onChange={(v) => updateSaleCosts({ legalFeesSell: v })} />
                          </FieldGroup>
                          <FieldGroup label="Advertising / Marketing">
                            <CurrencyInput value={sc.advertisingCosts} onChange={(v) => updateSaleCosts({ advertisingCosts: v })} />
                          </FieldGroup>
                          <FieldGroup label="Styling / Staging">
                            <CurrencyInput value={sc.stylingCosts} onChange={(v) => updateSaleCosts({ stylingCosts: v })} />
                          </FieldGroup>
                          <FieldGroup label="Seller's Agent / Advisory Fees">
                            <CurrencyInput value={sc.sellerAdvisoryFees} onChange={(v) => updateSaleCosts({ sellerAdvisoryFees: v })} />
                          </FieldGroup>
                          <div className="flex justify-between text-xs pt-1 border-t border-border">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold text-foreground">${totalSelling.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Capital Gains Tax</h4>
                          <FieldGroup label="CGT Discount">
                            <select
                              value={sc.cgtDiscount}
                              onChange={(e) => updateSaleCosts({ cgtDiscount: Number(e.target.value) })}
                              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value={0.5}>50% (held 12+ months)</option>
                              <option value={0}>0% (held less than 12 months)</option>
                            </select>
                          </FieldGroup>
                          <FieldGroup label="Marginal Tax Rate (incl. Medicare levy)">
                            <select
                              value={sc.incomeTaxRate}
                              onChange={(e) => { manualTaxOverride.current = true; updateSaleCosts({ incomeTaxRate: Number(e.target.value), includeMedicareLevy: false, taxRateUserSet: true } as any); }}
                              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value={0}>0% – Tax-free threshold ($0 – $18,200)</option>
                              <option value={0.18}>16% + 2% ML ($18,201 – $45,000)</option>
                              <option value={0.25}>Base Rate Entity Company (25%)</option>
                              <option value={0.30}>Company Tax Rate (30%)</option>
                              <option value={0.32}>30% + 2% ML ($45,001 – $135,000)</option>
                              <option value={0.39}>37% + 2% ML ($135,001 – $190,000)</option>
                              <option value={0.47}>45% + 2% ML ($190,001+)</option>
                            </select>
                          </FieldGroup>
                          <FieldGroup label="Capital Losses to Offset">
                            <div className="flex items-center gap-2 mb-2">
                              <Switch
                                checked={!!(sc as any).capitalLossesEnabled}
                                onCheckedChange={(checked) => {
                                  if (!checked) updateSaleCosts({ capitalLossesEnabled: false, capitalLosses: 0 } as any);
                                  else updateSaleCosts({ capitalLossesEnabled: true } as any);
                                }}
                              />
                              <span className="text-xs text-muted-foreground">Apply capital losses</span>
                            </div>
                            {(sc as any).capitalLossesEnabled && (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={sc.capitalLosses ? `$${sc.capitalLosses.toLocaleString()}` : ""}
                                placeholder="$0"
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^0-9]/g, "");
                                  updateSaleCosts({ capitalLosses: raw ? Number(raw) : 0 });
                                }}
                                className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                              />
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">Prior or current year capital losses to offset against this gain</p>
                          </FieldGroup>
                        </div>

                        {(() => {
                          if (!purchasePrice) {
                            return (
                              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
                                <AlertTriangle size={18} className="text-destructive shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Purchase Price required</p>
                                  <p className="text-xs text-muted-foreground">Please enter the original Purchase Price above to calculate Net Proceeds After CGT.</p>
                                </div>
                              </div>
                            );
                          }
                          const losses = sc.capitalLosses || 0;
                          const gainAfterLosses = Math.max(0, capitalGain - losses);
                          const discountedGain = gainAfterLosses * (1 - sc.cgtDiscount);
                          const effectiveRate = sc.incomeTaxRate;
                          const cgtPayable = Math.round(discountedGain * effectiveRate);
                          const netAfterCGT = saleProceeds - cgtPayable;
                          return (
                            <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Cash Position</h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale Price{sellYears > 0 ? ` (in ${sellYears}yr @ ${growthRate}%)` : ""}</span>
                                <span className="text-foreground font-medium">${currentValue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: Loan Balance</span>
                                <span className="text-destructive font-medium">-${loanBal.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: Selling Costs</span>
                                <span className="text-destructive font-medium">-${totalSelling.toLocaleString()}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-sm font-bold">
                                <span className="text-foreground">Net Sale Proceeds</span>
                                <span className={saleProceeds >= 0 ? "text-accent" : "text-destructive"}>${saleProceeds.toLocaleString()}</span>
                              </div>
                              <Separator />
                              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider pt-1">CGT Calculation</h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sale Price</span>
                                <span className="text-foreground font-medium">${currentValue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: Cost Base (incl. selling)</span>
                                <span className="text-destructive font-medium">-${costBase.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Capital Gain</span>
                                <span className="text-foreground font-medium">${capitalGain.toLocaleString()}</span>
                              </div>
                              {losses > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Less: Capital Losses</span>
                                  <span className="text-destructive font-medium">-${losses.toLocaleString()}</span>
                                </div>
                              )}
                              {losses > 0 && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Net Capital Gain</span>
                                  <span className="text-foreground font-medium">${gainAfterLosses.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">After {sc.cgtDiscount * 100}% Discount</span>
                                <span className="text-foreground font-medium">${discountedGain.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax Rate</span>
                                <span className="text-foreground font-medium">{(effectiveRate * 100).toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Less: CGT Payable</span>
                                <span className="text-destructive font-medium">-${cgtPayable.toLocaleString()}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between text-sm font-bold">
                                <span className="text-foreground">Net Proceeds After CGT</span>
                                <span className={netAfterCGT >= 0 ? "text-accent" : "text-destructive"}>${netAfterCGT.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Settlement</h4>
                          <FieldGroup label="Settlement Date">
                            <DateInput value={property.purchase.settlementDate} onChange={(v) => updatePurchase({ settlementDate: v })} placeholder="Select settlement date" minDate={property.purchase.purchaseDate ? new Date(property.purchase.purchaseDate) : undefined} />
                          </FieldGroup>
                          {property.purchase.settlementDate && new Date(property.purchase.settlementDate) <= new Date() && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
                              ✓ This property has settled and will appear in the Sold Properties section
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  </>)}
                </>
              );
            })()}
          </div>

          {/* Loan Details - only show for future/proposed properties */}
          {!isExisting && (
            <>
              <SectionHeader title="Loan Details" />
              <div className="space-y-4">
                <FieldGroup label="Proposed Loan Amount">
                  <CurrencyInput
                    value={(property as FutureProperty).proposedLoanAmount ?? Math.round((property as FutureProperty).purchasePrice * (property as FutureProperty).lvr / 100)}
                    onChange={(v) => update({ proposedLoanAmount: v } as Partial<FutureProperty>)}
                  />
                </FieldGroup>
                <FieldGroup label="Interest Rate">
                  <NumberInput value={property.loan.interestRate} onChange={(v) => updateLoan({ interestRate: v })} suffix="%" placeholder="6.2" />
                </FieldGroup>
                <FieldGroup label="Interest-Only Period">
                  <NumberInput value={property.loan.interestOnlyPeriodYears} onChange={(v) => updateLoan({ interestOnlyPeriodYears: v })} suffix="years" placeholder="0" />
                </FieldGroup>
                <FieldGroup label="Loan Term">
                  <NumberInput value={property.loan.loanTermYears} onChange={(v) => updateLoan({ loanTermYears: v })} suffix="years" placeholder="30" />
                </FieldGroup>
                <FieldGroup label="Lender">
                  <TextInput value={property.loan.lenderName} onChange={(v) => updateLoan({ lenderName: v })} placeholder="e.g. Commonwealth Bank" />
                </FieldGroup>
                <FieldGroup label="Offset Balance">
                  <CurrencyInput value={property.loan.offsetBalance} onChange={(v) => updateLoan({ offsetBalance: v })} />
                </FieldGroup>
              </div>
            </>
          )}

          {/* Rental Income - hide for PPOR and future/proposed */}
          {!pporMode && isExisting && (
            <>
              <SectionHeader title="Rental Income" />
              <div className="space-y-4">
                <FieldGroup label="Weekly Rent">
                  <CurrencyInput value={property.rental.weeklyRent} onChange={(v) => updateRental({ weeklyRent: v })} />
                </FieldGroup>
              </div>
            </>
          )}



        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PropertyDetailSheet;
