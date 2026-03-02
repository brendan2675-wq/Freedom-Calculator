import { useState } from "react";
import { Plus, X, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
}

const PropertiesToBuy = ({ properties, setProperties, growthRate }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ suburb: '', purchasePrice: '', rentalYield: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  const addProperty = () => {
    if (!form.suburb) return;
    const price = parseInt(form.purchasePrice.replace(/[^0-9]/g, '')) || 0;
    const yieldPct = parseFloat(form.rentalYield) || 0;
    const futureValue = price * Math.pow(1 + growthRate / 100, 5);
    const loan = price * 0.8;
    const projectedEquity = Math.max(0, Math.round(futureValue - loan));

    setProperties([
      ...properties,
      {
        id: crypto.randomUUID(),
        suburb: form.suburb,
        purchasePrice: price,
        rentalYield: yieldPct,
        projectedEquity5yr: projectedEquity,
        ownership: "personal" as const,
        investmentType: "house" as const,
        loan: { ...defaultLoanDetails },
        rental: { ...defaultRentalDetails },
        purchase: { ...defaultPurchaseDetails, purchasePrice: price },
      },
    ]);
    setForm({ suburb: '', purchasePrice: '', rentalYield: '' });
    setOpen(false);
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  const totalEquity = properties.reduce((sum, p) => sum + p.projectedEquity5yr, 0);

  return (
    <TooltipProvider>
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
          Investment Properties to Purchase
        </h2>
        <div className="h-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="group bg-card rounded-xl shadow-md p-5 border-2 border-border relative flex flex-col cursor-pointer hover:shadow-xl hover:border-accent/50 hover:-translate-y-1 transition-all"
            >
              <button
                onClick={(e) => { e.stopPropagation(); removeProperty(p.id); }}
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-2 mb-3">
                <InvestmentTypeIcon type={p.investmentType} size={20} className="text-accent shrink-0" />
                <p className="font-semibold text-lg text-foreground">{p.suburb || "Untitled"}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs">Purchase Price</label>
                  <p className="text-foreground font-medium">${p.purchasePrice.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Rental Yield</label>
                  <p className="text-foreground font-medium">{p.rentalYield}%</p>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <p className="text-muted-foreground">
                    Projected equity (5yr):{" "}
                    <span className="text-accent font-bold">${p.projectedEquity5yr.toLocaleString()}</span>
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <p className="text-xs">Estimated equity after 5 years based on growth rate assumptions and 80% LVR.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Ownership badge */}
              <div className="mt-auto pt-3 border-t border-border flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                  {p.ownership === "trust" ? "Trust" : "Personal"}
                </span>
              </div>

              {/* Click cue */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Edit</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="rounded-xl border-2 border-dashed border-accent/40 p-5 flex flex-col items-center justify-center gap-2 min-h-[200px] hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent">
                <Plus size={28} />
                Add Property
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Add Property to Purchase</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <input
                  placeholder="Target suburb"
                  value={form.suburb}
                  onChange={(e) => setForm({ ...form, suburb: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  placeholder="Purchase price ($)"
                  inputMode="numeric"
                  value={form.purchasePrice}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value.replace(/[^0-9]/g, '') })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  placeholder="Expected rental yield (%)"
                  inputMode="decimal"
                  value={form.rentalYield}
                  onChange={(e) => setForm({ ...form, rentalYield: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={addProperty}
                  className="w-full bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Add Property
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {properties.length > 0 && (
          <div className="mt-6 bg-header rounded-xl p-4 text-center">
            <p className="text-primary-foreground text-sm">Total projected equity available</p>
            <p className="text-accent text-2xl font-bold">${totalEquity.toLocaleString()}</p>
          </div>
        )}

        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedId}
          onOpenChange={(o) => { if (!o) setSelectedId(null); }}
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
