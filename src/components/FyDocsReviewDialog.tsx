import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cashflowDocumentCategories, type CashflowDocumentFrequency, type ExtractedCashflowItem } from "@/lib/documentExtraction";

type FyDocsReviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ExtractedCashflowItem[];
  months: string[];
  onApply: (items: ExtractedCashflowItem[]) => void;
  onItemsChange: (items: ExtractedCashflowItem[]) => void;
};

const frequencies: CashflowDocumentFrequency[] = ["monthly", "quarterly", "annual"];

const parseAmount = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;

const isReady = (item: ExtractedCashflowItem) => item.status !== "failed" && item.monthIndex !== undefined && Boolean(item.amount && item.amount > 0);

const FyDocsReviewDialog = ({ open, onOpenChange, items, months, onApply, onItemsChange }: FyDocsReviewDialogProps) => {
  const [draftItems, setDraftItems] = useState(items);

  useEffect(() => {
    setDraftItems(items);
  }, [items, open]);

  const updateItem = (id: string, updates: Partial<ExtractedCashflowItem>) => {
    setDraftItems((current) => current.map((item) => item.id === id ? { ...item, ...updates, status: item.status === "failed" ? "failed" : "needs-review" } : item));
  };

  const removeItem = (id: string) => {
    setDraftItems((current) => current.filter((item) => item.id !== id));
  };

  const readyItems = draftItems.filter(isReady);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) onItemsChange(draftItems);
      onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>Review FY documents</DialogTitle>
          <DialogDescription>Complete each row before applying the approved amounts to this financial year.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {draftItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No documents selected.</div>
          ) : draftItems.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-border bg-background p-3 lg:grid-cols-[1.35fr_1fr_0.85fr_1.1fr_0.8fr_1fr_2.75rem] lg:items-end">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">File</label>
                <p className="truncate text-sm font-semibold text-foreground">{item.fileName}</p>
                <p className={`mt-1 text-xs ${item.status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>{item.note || "Needs review"}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Supplier</label>
                <Input value={item.supplier || ""} onChange={(event) => updateItem(item.id, { supplier: event.target.value })} className="h-10" disabled={item.status === "failed"} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Month</label>
                <select value={item.monthIndex ?? ""} onChange={(event) => updateItem(item.id, { monthIndex: event.target.value === "" ? undefined : Number(event.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground" disabled={item.status === "failed"}>
                  <option value="">Select</option>
                  {months.map((month, index) => <option key={month} value={index}>{month}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Category</label>
                <select value={item.category} onChange={(event) => updateItem(item.id, { category: event.target.value as ExtractedCashflowItem["category"] })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground" disabled={item.status === "failed"}>
                  {cashflowDocumentCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Amount</label>
                <div className="flex h-10 items-center rounded-md border border-input bg-background px-3">
                  <span className="text-sm font-bold text-accent">$</span>
                  <input value={item.amount ? item.amount.toLocaleString() : ""} onChange={(event) => updateItem(item.id, { amount: parseAmount(event.target.value) })} className="min-w-0 flex-1 bg-transparent pl-1 text-sm font-semibold text-foreground outline-none tabular-nums" disabled={item.status === "failed"} />
                </div>
              </div>
              <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <input type="checkbox" checked={Boolean(item.recurring?.isRecurring)} onChange={(event) => updateItem(item.id, { recurring: { isRecurring: event.target.checked, frequency: item.recurring?.frequency || "monthly" } })} className="h-4 w-4 accent-accent" disabled={item.status === "failed"} />
                  Recurring
                </label>
                <select value={item.recurring?.frequency || "monthly"} onChange={(event) => updateItem(item.id, { recurring: { isRecurring: true, frequency: event.target.value as CashflowDocumentFrequency } })} className="h-10 rounded-md border border-input bg-background px-2 text-xs font-semibold capitalize text-foreground" disabled={item.status === "failed" || !item.recurring?.isRecurring}>
                  {frequencies.map((frequency) => <option key={frequency} value={frequency}>{frequency}</option>)}
                </select>
              </div>
              <button onClick={() => removeItem(item.id)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${item.fileName}`}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:space-x-0">
          <button onClick={() => { onItemsChange(draftItems); onOpenChange(false); }} className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">Save review</button>
          <button onClick={() => onApply(readyItems)} disabled={readyItems.length === 0} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:pointer-events-none disabled:opacity-50">
            <Check size={16} /> Apply {readyItems.length || ""} to cashflow
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FyDocsReviewDialog;