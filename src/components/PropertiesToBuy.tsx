import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import OwnershipToggle from "@/components/OwnershipToggle";

export interface FutureProperty {
  id: string;
  suburb: string;
  purchasePrice: number;
  rentalYield: number;
  projectedEquity5yr: number;
  ownership: "trust" | "personal";
}

interface Props {
  properties: FutureProperty[];
  setProperties: (p: FutureProperty[]) => void;
  growthRate: number;
}

const PropertiesToBuy = ({ properties, setProperties, growthRate }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ suburb: '', purchasePrice: '', rentalYield: '' });

  const addProperty = () => {
    if (!form.suburb) return;
    const price = parseInt(form.purchasePrice.replace(/[^0-9]/g, '')) || 0;
    const yieldPct = parseFloat(form.rentalYield) || 0;
    // Projected equity in 5 years: value * (1+growth)^5 - price (assuming 80% LVR)
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
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
        Investment Properties to Purchase
      </h2>
      <div className="h-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p) => (
          <div key={p.id} className="bg-card rounded-xl shadow-md p-5 border border-border relative flex flex-col">
            <button onClick={() => removeProperty(p.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
            <input
              value={p.suburb}
              onChange={(e) => setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, suburb: e.target.value } : prop))}
              className="font-semibold text-lg text-foreground mb-3 bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none w-full transition-colors"
              placeholder="Enter suburb name"
            />
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">Purchase price: <span className="text-foreground font-medium">${p.purchasePrice.toLocaleString()}</span></p>
              <p className="text-muted-foreground">Rental yield: <span className="text-foreground font-medium">{p.rentalYield}%</span></p>
              <p className="text-muted-foreground">Projected equity (5yr): <span className="text-accent font-bold">${p.projectedEquity5yr.toLocaleString()}</span></p>
            </div>
            <div className="mt-auto pt-3 border-t border-border">
              <OwnershipToggle
                value={p.ownership}
                onChange={(v) => setProperties(properties.map((prop) => prop.id === p.id ? { ...prop, ownership: v } : prop))}
              />
            </div>
          </div>
        ))}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="rounded-xl border-2 border-dashed border-accent/40 p-5 flex flex-col items-center justify-center gap-2 min-h-[180px] hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent">
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
    </section>
  );
};

export default PropertiesToBuy;
