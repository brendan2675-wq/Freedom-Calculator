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
import { CalendarIcon, Plus, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type PropertyType = ExistingProperty | FutureProperty;

interface Props {
  property: PropertyType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: PropertyType) => void;
  variant: "existing" | "future";
  growthRate?: number;
  portfolioMode?: boolean;
  pporMode?: boolean;
}

const currencyFormat = (v: number) => v.toLocaleString();
const parseCurrency = (v: string) => parseInt(v.replace(/[^0-9]/g, "")) || 0;

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <div className="mt-1">{children}</div>
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

function NumberInput({ value, onChange, suffix, placeholder }: { value: number; onChange: (v: number) => void; suffix?: string; placeholder?: string }) {
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
        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
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

function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
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
    // Auto-parse dd/MM/yyyy
    const match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const parsed = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      if (!isNaN(parsed.getTime())) {
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

const PropertyDetailSheet = ({ property, open, onOpenChange, onUpdate, variant, growthRate = 6, portfolioMode = false, pporMode = false }: Props) => {
  const isExisting = variant === "existing";
  const manualTaxOverride = useRef(false);

  useEffect(() => {
    manualTaxOverride.current = false;
  }, [property?.id]);

  useEffect(() => {
    if (!property || !isExisting || manualTaxOverride.current) return;
    const ep = property as ExistingProperty;
    if (!ep.earmarked) return;
    const sc = ep.saleCosts || { ...defaultSaleCosts };
    const purchasePrice = ep.purchase.purchasePrice || 0;
    if (!purchasePrice) return;
    const autoStampDuty = ep.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, ep.state, ep.purchase.purchaseDate || undefined) : Math.round(purchasePrice * 0.05);
    const stampDutyAcq = sc.stampDutyOnPurchase || autoStampDuty;
    const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
    const totalImprovements = sc.renovations + sc.structuralWork;
    const totalOwnership = sc.ownershipCostsTotal;
    const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
    const costBase = totalAcquisition + totalImprovements + totalOwnership + totalSelling;
    const capitalGain = Math.max(0, ep.estimatedValue - costBase);
    const discountedGain = capitalGain * (1 - sc.cgtDiscount);

    let suggestedRate = 0;
    if (discountedGain > 190000) suggestedRate = 0.45;
    else if (discountedGain > 135000) suggestedRate = 0.37;
    else if (discountedGain > 45000) suggestedRate = 0.30;
    else if (discountedGain > 18200) suggestedRate = 0.16;
    else suggestedRate = 0.45;

    if (sc.incomeTaxRate !== suggestedRate) {
      onUpdate({ ...property, saleCosts: { ...sc, incomeTaxRate: suggestedRate } } as ExistingProperty);
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
    update({ purchase: { ...property.purchase, ...fields } });
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
          <SectionHeader title="Basic Info" />
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
                <FieldGroup label="Estimated Value">
                  <CurrencyInput
                    value={(property as ExistingProperty).estimatedValue}
                    onChange={(v) => update({ estimatedValue: v } as Partial<ExistingProperty>)}
                  />
                </FieldGroup>
                <FieldGroup label="Current Loan Balance">
                  <CurrencyInput
                    value={(property as ExistingProperty).loanBalance}
                    onChange={(v) => update({ loanBalance: v } as Partial<ExistingProperty>)}
                  />
                </FieldGroup>

                {/* Loan Splits */}
                <div className="pl-2 border-l-2 border-accent/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground font-medium">Loan Splits</label>
                    <button
                      onClick={() => {
                        const ep = property as ExistingProperty;
                        const splits = ep.loanSplits || [];
                        const newSplit: LoanSplit = { id: crypto.randomUUID(), label: `Split ${splits.length + 1}`, amount: 0 };
                        update({ loanSplits: [...splits, newSplit] } as Partial<ExistingProperty>);
                      }}
                      className="text-accent hover:text-accent/80 transition-colors p-0.5"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {((property as ExistingProperty).loanSplits || []).map((split, idx) => (
                    <div key={split.id} className="flex items-center gap-2">
                      <input
                        value={split.label}
                        onChange={(e) => {
                          const ep = property as ExistingProperty;
                          const splits = [...(ep.loanSplits || [])];
                          splits[idx] = { ...splits[idx], label: e.target.value };
                          update({ loanSplits: splits } as Partial<ExistingProperty>);
                        }}
                        className="w-24 py-1.5 px-2 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-accent"
                        placeholder="Label"
                      />
                      <div className="flex-1">
                        <CurrencyInput
                          value={split.amount}
                          onChange={(v) => {
                            const ep = property as ExistingProperty;
                            const splits = [...(ep.loanSplits || [])];
                            splits[idx] = { ...splits[idx], amount: v };
                            const total = splits.reduce((s, sp) => s + sp.amount, 0);
                            update({ loanSplits: splits, loanBalance: total } as Partial<ExistingProperty>);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const ep = property as ExistingProperty;
                          const splits = (ep.loanSplits || []).filter((_, i) => i !== idx);
                          const total = splits.reduce((s, sp) => s + sp.amount, 0);
                          update({ loanSplits: splits, loanBalance: total } as Partial<ExistingProperty>);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
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
                <FieldGroup label="Suburb">
                  <TextInput
                    value={(property as FutureProperty).suburb}
                    onChange={(v) => update({ suburb: v } as Partial<FutureProperty>)}
                    placeholder="e.g. Parramatta"
                    autoFocus={!(property as FutureProperty).suburb}
                  />
                </FieldGroup>
                <FieldGroup label="Purchase Price">
                  <CurrencyInput
                    value={(property as FutureProperty).purchasePrice}
                    onChange={(v) => {
                      const weeklyRent = property.rental.weeklyRent;
                      const annualRent = weeklyRent * 52;
                      const yieldPct = v > 0 ? parseFloat(((annualRent / v) * 100).toFixed(2)) : 0;
                      update({ purchasePrice: v, rentalYield: yieldPct } as Partial<FutureProperty>);
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
            {!isExisting && (() => {
              const fp = property as FutureProperty;
              const sc = fp.saleCosts || { ...defaultSaleCosts };
              const purchasePrice = fp.purchasePrice || 0;
              const purchaseDate = fp.purchase?.purchaseDate || undefined;
              const autoStampDuty = fp.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, fp.state, purchaseDate) : 0;
              const stampDutyAcq = sc.stampDutyOnPurchase || autoStampDuty || Math.round(purchasePrice * 0.05);
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
            {isExisting && !portfolioMode && (() => {
              const ep = property as ExistingProperty;
              const sc = ep.saleCosts || { ...defaultSaleCosts };
              const purchasePrice = ep.purchase.purchasePrice || 0;
              const purchaseDate = ep.purchase.purchaseDate || undefined;
              const autoStampDuty = ep.state && purchasePrice > 0 ? calculateStampDuty(purchasePrice, ep.state, purchaseDate) : 0;
              const stampDutyAcq = sc.stampDutyOnPurchase || autoStampDuty || Math.round(purchasePrice * 0.05);
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
                      <CurrencyInput value={purchasePrice} onChange={(v) => updatePurchase({ purchasePrice: v })} />
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
                        onChange={(e) => update({ sellInYears: Number(e.target.value) } as Partial<ExistingProperty>)}
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
                    const currentValue = sellYears > 0
                      ? Math.round(ep.estimatedValue * Math.pow(1 + growthRate / 100, sellYears))
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
                          <FieldGroup label="Marginal Tax Rate (excl. Medicare)">
                            <select
                              value={sc.incomeTaxRate}
                              onChange={(e) => { manualTaxOverride.current = true; updateSaleCosts({ incomeTaxRate: Number(e.target.value) }); }}
                              className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value={0}>0% – $0 – $18,200</option>
                              <option value={0.16}>16% – $18,201 – $45,000</option>
                              <option value={0.25}>25% – Base Entity Rate</option>
                              <option value={0.30}>30% – $45,001 – $135,000 &amp; Company Tax Rate</option>
                              <option value={0.37}>37% – $135,001 – $190,000</option>
                              <option value={0.45}>45% – $190,001+</option>
                            </select>
                          </FieldGroup>
                          <p className="text-[10px] text-muted-foreground">+ 2% Medicare levy applied automatically</p>
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
                          const discountedGain = capitalGain * (1 - sc.cgtDiscount);
                          const effectiveRate = sc.incomeTaxRate + 0.02;
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
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">After {sc.cgtDiscount * 100}% Discount</span>
                                <span className="text-foreground font-medium">${discountedGain.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax Rate ({(sc.incomeTaxRate * 100).toFixed(0)}% + 2% ML)</span>
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
                            <DateInput value={property.purchase.settlementDate} onChange={(v) => updatePurchase({ settlementDate: v })} placeholder="Select settlement date" />
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
                </>
              );
            })()}
          </div>

          {/* Loan Details */}
          <SectionHeader title="Loan Details" />
          <div className="space-y-4">
            {!isExisting && (
              <FieldGroup label="Proposed Loan Amount">
                <CurrencyInput
                  value={(property as FutureProperty).proposedLoanAmount ?? Math.round((property as FutureProperty).purchasePrice * (property as FutureProperty).lvr / 100)}
                  onChange={(v) => update({ proposedLoanAmount: v } as Partial<FutureProperty>)}
                />
              </FieldGroup>
            )}
            <FieldGroup label="Interest Rate">
              <NumberInput value={property.loan.interestRate} onChange={(v) => updateLoan({ interestRate: v })} suffix="%" placeholder="6.2" />
            </FieldGroup>
            {!pporMode && (
              <FieldGroup label="Interest-Only Period">
                <NumberInput value={property.loan.interestOnlyPeriodYears} onChange={(v) => updateLoan({ interestOnlyPeriodYears: v })} suffix="years" placeholder="0" />
              </FieldGroup>
            )}
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

          {/* Purchase Date for non-existing properties */}
          {!isExisting && (
            <>
              <SectionHeader title="Purchase Details" />
              <div className="space-y-4">
                <FieldGroup label="Purchase Date">
                  <DateInput value={property.purchase.purchaseDate} onChange={(v) => updatePurchase({ purchaseDate: v })} placeholder="Select purchase date" />
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
