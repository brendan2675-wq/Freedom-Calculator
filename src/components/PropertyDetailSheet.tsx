import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import OwnershipToggle from "@/components/OwnershipToggle";
import { InvestmentTypeIcon, investmentTypes, getInvestmentTypeLabel } from "@/components/InvestmentTypeIcon";
import type { ExistingProperty, FutureProperty, LoanDetails, RentalDetails, PurchaseDetails, InvestmentType, LoanSplit } from "@/types/property";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
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
  return (
    <div className="flex items-center gap-1">
      <input
        inputMode="decimal"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        placeholder={placeholder}
        className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
      />
      {suffix && <span className="text-muted-foreground text-sm shrink-0">{suffix}</span>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
    />
  );
}

function DateInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const date = value ? new Date(value) : undefined;
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
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange(d ? d.toISOString() : "")}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
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

const PropertyDetailSheet = ({ property, open, onOpenChange, onUpdate, variant }: Props) => {
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

  const isExisting = variant === "existing";
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
                <FieldGroup label="Suburb">
                  <TextInput
                    value={(property as FutureProperty).suburb}
                    onChange={(v) => update({ suburb: v } as Partial<FutureProperty>)}
                    placeholder="e.g. Parramatta"
                  />
                </FieldGroup>
                <FieldGroup label="Purchase Price">
                  <CurrencyInput
                    value={(property as FutureProperty).purchasePrice}
                    onChange={(v) => update({ purchasePrice: v } as Partial<FutureProperty>)}
                  />
                </FieldGroup>
                <FieldGroup label="Expected Rental Yield">
                  <NumberInput
                    value={(property as FutureProperty).rentalYield}
                    onChange={(v) => update({ rentalYield: v } as Partial<FutureProperty>)}
                    suffix="%"
                  />
                </FieldGroup>
              </>
            )}
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
            <FieldGroup label="Ownership Structure">
              <OwnershipToggle value={property.ownership} onChange={(v) => update({ ownership: v })} />
            </FieldGroup>
            {isExisting && (
              <>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={(property as ExistingProperty).earmarked}
                    onCheckedChange={(v) => update({ earmarked: v } as Partial<ExistingProperty>)}
                  />
                  <span className="text-sm text-muted-foreground">Sell down this property</span>
                </div>
                {(property as ExistingProperty).earmarked && (() => {
                  const ep = property as ExistingProperty;
                  const currentValue = ep.estimatedValue;
                  const loanBal = ep.loanBalance;
                  const stampDuty = Math.round(currentValue * 0.05);
                  const sellingFees = Math.round(currentValue * 0.02);
                  const saleProceeds = currentValue - loanBal - stampDuty - sellingFees;
                  return (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Value</span>
                        <span className="text-foreground font-medium">${currentValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Less: Loan Balance</span>
                        <span className="text-destructive font-medium">-${loanBal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Less: Stamp Duty (5%)</span>
                        <span className="text-destructive font-medium">-${stampDuty.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Less: Selling Fees (2%)</span>
                        <span className="text-destructive font-medium">-${sellingFees.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-foreground">Sale Proceeds</span>
                        <span className={saleProceeds >= 0 ? "text-accent" : "text-destructive"}>${saleProceeds.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
                <FieldGroup label="Settlement Date">
                  <DateInput value={property.purchase.settlementDate} onChange={(v) => updatePurchase({ settlementDate: v })} placeholder="Select settlement date" />
                </FieldGroup>
              </>
            )}
          </div>

          {/* Loan Details */}
          <SectionHeader title="Loan Details" />
          <div className="space-y-4">
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

          {/* Rental Income */}
          <SectionHeader title="Rental Income" />
          <div className="space-y-4">
            <FieldGroup label="Weekly Rent">
              <CurrencyInput value={property.rental.weeklyRent} onChange={(v) => updateRental({ weeklyRent: v })} />
            </FieldGroup>
          </div>

          {/* Purchase Details */}
          <SectionHeader title="Purchase Details" />
          <div className="space-y-4">
            <FieldGroup label="Purchase Date">
              <DateInput value={property.purchase.purchaseDate} onChange={(v) => updatePurchase({ purchaseDate: v })} placeholder="Select purchase date" />
            </FieldGroup>
            <FieldGroup label="Original Purchase Price">
              <CurrencyInput value={property.purchase.purchasePrice} onChange={(v) => updatePurchase({ purchasePrice: v })} />
            </FieldGroup>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PropertyDetailSheet;
