import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import OwnershipToggle from "@/components/OwnershipToggle";

export interface ExistingProperty {
  id: string;
  nickname: string;
  estimatedValue: number;
  loanBalance: number;
  earmarked: boolean;
  ownership: "trust" | "personal";
}

interface Props {
  properties: ExistingProperty[];
  setProperties: (p: ExistingProperty[]) => void;
}

const ExistingProperties = ({ properties, setProperties }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nickname: '', estimatedValue: '', loanBalance: '' });

  const addProperty = () => {
    if (!form.nickname) return;
    setProperties([
      ...properties,
      {
        id: crypto.randomUUID(),
        nickname: form.nickname,
        estimatedValue: parseInt(form.estimatedValue.replace(/[^0-9]/g, '')) || 0,
        loanBalance: parseInt(form.loanBalance.replace(/[^0-9]/g, '')) || 0,
        earmarked: false,
        ownership: "personal" as const,
      },
    ]);
    setForm({ nickname: '', estimatedValue: '', loanBalance: '' });
    setOpen(false);
  };

  const toggleEarmark = (id: string) => {
    setProperties(properties.map((p) => (p.id === id ? { ...p, earmarked: !p.earmarked } : p)));
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
        Your Existing Investment Properties
      </h2>
      <div className="h-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p) => {
          const equity = Math.max(0, p.estimatedValue - p.loanBalance);
          const update = (field: Partial<ExistingProperty>) =>
            setProperties(properties.map((prop) => (prop.id === p.id ? { ...prop, ...field } : prop)));
          return (
            <div
              key={p.id}
              className="bg-card rounded-xl shadow-md p-5 border-2 border-border transition-all relative flex flex-col"
            >
              <button onClick={() => removeProperty(p.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
              <input
                value={p.nickname}
                onChange={(e) => update({ nickname: e.target.value })}
                className="font-semibold text-lg text-foreground mb-3 bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none w-full transition-colors"
                placeholder="Property nickname"
              />
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-muted-foreground text-xs">Current Value</label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <input
                      inputMode="numeric"
                      value={p.estimatedValue.toLocaleString()}
                      onChange={(e) => update({ estimatedValue: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                      className="w-full py-1 bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none text-foreground font-medium transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs">Current Loan</label>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground text-sm">$</span>
                    <input
                      inputMode="numeric"
                      value={p.loanBalance.toLocaleString()}
                      onChange={(e) => update({ loanBalance: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                      className="w-full py-1 bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none text-foreground font-medium transition-colors"
                    />
                  </div>
                </div>
                <p className="text-muted-foreground pt-1">Usable equity: <span className="text-accent font-bold">${equity.toLocaleString()}</span></p>
              </div>
              <div className="mt-auto pt-3 border-t border-border space-y-3">
                <OwnershipToggle value={p.ownership} onChange={(v) => update({ ownership: v })} />
                <div className="flex items-center gap-2">
                  <Switch checked={p.earmarked} onCheckedChange={() => toggleEarmark(p.id)} />
                  <span className="text-sm text-muted-foreground">Sell down</span>
                </div>
              </div>
            </div>
          );
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="rounded-xl border-2 border-dashed border-accent/40 p-5 flex flex-col items-center justify-center gap-2 min-h-[200px] hover:border-accent hover:bg-accent/5 transition-all font-medium text-accent">
              <Plus size={28} />
              Add Property
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Add Existing Property</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <input
                placeholder="Property nickname"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Current value ($)"
                inputMode="numeric"
                value={form.estimatedValue}
                onChange={(e) => setForm({ ...form, estimatedValue: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Current loan ($)"
                inputMode="numeric"
                value={form.loanBalance}
                onChange={(e) => setForm({ ...form, loanBalance: e.target.value.replace(/[^0-9]/g, '') })}
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
    </section>
  );
};

export default ExistingProperties;
