import { useState } from "react";
import { Plus, X, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultRentalDetails, defaultPurchaseDetails } from "@/types/property";

export type { ExistingProperty } from "@/types/property";

interface Props {
  properties: ExistingProperty[];
  setProperties: (p: ExistingProperty[]) => void;
}

const ExistingProperties = ({ properties, setProperties }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nickname: '', estimatedValue: '', loanBalance: '' });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

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
        loan: { ...defaultLoanDetails },
        rental: { ...defaultRentalDetails },
        purchase: { ...defaultPurchaseDetails },
      },
    ]);
    setForm({ nickname: '', estimatedValue: '', loanBalance: '' });
    setOpen(false);
  };

  const removeProperty = (id: string) => {
    setProperties(properties.filter((p) => p.id !== id));
  };

  return (
    <TooltipProvider>
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-1 gold-underline pb-2">
          Your Existing Investment Properties
        </h2>
        <div className="h-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((p) => {
            const equity = Math.max(0, p.estimatedValue - p.loanBalance);
            return (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="group bg-card rounded-xl shadow-md p-5 border-2 border-border transition-all relative flex flex-col cursor-pointer hover:shadow-xl hover:border-accent/50 hover:-translate-y-1"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); removeProperty(p.id); }}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
                >
                  <X size={16} />
                </button>
                <p className="font-semibold text-lg text-foreground mb-3">{p.nickname || "Untitled"}</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="text-muted-foreground text-xs">Current Value</label>
                    <p className="text-foreground font-medium">${p.estimatedValue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">Current Loan</label>
                    <p className="text-foreground font-medium">${p.loanBalance.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <p className="text-muted-foreground">
                      Usable equity:{" "}
                      <span className="text-accent font-bold">${equity.toLocaleString()}</span>
                    </p>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info size={14} className="text-muted-foreground hover:text-foreground cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[220px]">
                        <p className="text-xs">The difference between property value and loan balance — equity that could be accessed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Ownership & earmarked badges */}
                <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
                    {p.ownership === "trust" ? "Trust" : "Personal"}
                  </span>
                  {p.earmarked && (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                      Sell down
                    </span>
                  )}
                </div>

                {/* Click cue */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Edit</span>
                  <ChevronRight size={14} />
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

        <PropertyDetailSheet
          property={selectedProperty}
          open={!!selectedId}
          onOpenChange={(o) => { if (!o) setSelectedId(null); }}
          onUpdate={(updated) => {
            setProperties(properties.map((p) => p.id === updated.id ? updated as ExistingProperty : p));
          }}
          variant="existing"
        />
      </section>
    </TooltipProvider>
  );
};

export default ExistingProperties;
