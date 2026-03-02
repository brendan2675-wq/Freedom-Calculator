import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

export interface ExistingProperty {
  id: string;
  nickname: string;
  estimatedValue: number;
  loanBalance: number;
  earmarked: boolean;
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
      <h2 className="font-serif text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
        Your Existing Investment Properties
      </h2>
      <div className="h-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((p) => {
          const equity = Math.max(0, p.estimatedValue - p.loanBalance);
          return (
            <div
              key={p.id}
              className={`bg-card rounded-xl shadow-md p-5 border-2 transition-all relative ${
                p.earmarked ? 'border-accent' : 'border-border'
              }`}
            >
              {p.earmarked && (
                <span className="absolute top-3 right-3 bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  Earmarked
                </span>
              )}
              <button onClick={() => removeProperty(p.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground" style={p.earmarked ? { right: '5.5rem' } : {}}>
                <X size={16} />
              </button>
              <h4 className="font-serif font-semibold text-lg text-foreground mb-3">{p.nickname}</h4>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Value: <span className="text-foreground font-medium">${p.estimatedValue.toLocaleString()}</span></p>
                <p className="text-muted-foreground">Loan: <span className="text-foreground font-medium">${p.loanBalance.toLocaleString()}</span></p>
                <p className="text-muted-foreground">Usable equity: <span className="text-accent font-bold">${equity.toLocaleString()}</span></p>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                <Switch checked={p.earmarked} onCheckedChange={() => toggleEarmark(p.id)} />
                <span className="text-sm text-muted-foreground">Sell down</span>
              </div>
            </div>
          );
        })}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="bg-accent text-accent-foreground rounded-xl shadow-md p-5 flex flex-col items-center justify-center gap-2 min-h-[180px] hover:opacity-90 transition-opacity font-medium">
              <Plus size={28} />
              Add Property
            </button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle className="font-serif">Add Existing Property</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <input
                placeholder="Property nickname"
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Estimated value ($)"
                inputMode="numeric"
                value={form.estimatedValue}
                onChange={(e) => setForm({ ...form, estimatedValue: e.target.value.replace(/[^0-9]/g, '') })}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                placeholder="Loan against it ($)"
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
