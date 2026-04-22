import { useMemo, useState } from "react";
import { ArrowLeft, Banknote, Building2, CalendarDays, Home, Percent, Plus, Trash2, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdviserActingBanner from "@/components/AdviserActingBanner";
import UserMenu from "@/components/UserMenu";
import { Input } from "@/components/ui/input";

const months = ["Jul-26", "Aug-26", "Sep-26", "Oct-26", "Nov-26", "Dec-26", "Jan-27", "Feb-27", "Mar-27", "Apr-27", "May-27", "Jun-27"];

const INITIAL_WEEKLY_RENT = 600;
const INITIAL_LOAN_AMOUNT = 500000;
const INITIAL_INTEREST_RATE = 6.54;

type CashflowRow = {
  id: string;
  label: string;
  type: "income" | "expense";
  values: number[];
  weeklyRent?: number;
};

const monthlyRentFromWeekly = (weeklyRent: number) => Math.round((weeklyRent * 52) / 12);
const monthlyInterestOnlyCost = (loanAmount: number, interestRate: number) => Math.round((loanAmount * (interestRate / 100)) / 12);

const initialRows: CashflowRow[] = [
  { id: "rental-income", label: "Rental income", type: "income", weeklyRent: INITIAL_WEEKLY_RENT, values: Array(12).fill(monthlyRentFromWeekly(INITIAL_WEEKLY_RENT)) },
  { id: "advertising", label: "Advertising for tenants", type: "expense", values: Array(12).fill(0) },
  { id: "bank-fees", label: "Bank fees", type: "expense", values: Array(12).fill(0) },
  { id: "body-corporate", label: "Body corporate fees", type: "expense", values: Array(12).fill(0) },
  { id: "borrowing", label: "Borrowing expenses", type: "expense", values: Array(12).fill(0) },
  { id: "cleaning", label: "Cleaning", type: "expense", values: Array(12).fill(0) },
  { id: "council", label: "Council rates", type: "expense", values: Array(12).fill(0) },
  { id: "depreciation", label: "Depreciation on plant", type: "expense", values: Array(12).fill(0) },
  { id: "gardening", label: "Gardening / lawn mowing", type: "expense", values: Array(12).fill(0) },
  { id: "insurance", label: "Insurance", type: "expense", values: [189, 189, 189, 189, 189, 189, 189, 189, 0, 0, 0, 0] },
  { id: "interest", label: "Interest on loan", type: "expense", values: Array(12).fill(monthlyInterestOnlyCost(INITIAL_LOAN_AMOUNT, INITIAL_INTEREST_RATE)) },
  { id: "land-tax", label: "Land tax", type: "expense", values: Array(12).fill(0) },
  { id: "legal", label: "Legal fees", type: "expense", values: Array(12).fill(0) },
  { id: "pest", label: "Pest control", type: "expense", values: Array(12).fill(0) },
  { id: "agent-fees", label: "Property agent fees / commission", type: "expense", values: [429, 282, 282, 282, 125, 251, 251, 251, 0, 0, 0, 0] },
  { id: "repairs", label: "Repairs and maintenance", type: "expense", values: [0, 0, 0, 0, 0, 275, 0, 2750, 0, 0, 0, 0] },
  { id: "capital-works", label: "Capital works deductions", type: "expense", values: Array(12).fill(0) },
  { id: "stationery", label: "Stationery, telephone and postage", type: "expense", values: Array(12).fill(0) },
  { id: "travel", label: "Travel expenses", type: "expense", values: Array(12).fill(0) },
  { id: "water", label: "Water charges", type: "expense", values: [0, 0, 285, 0, 0, 856, 0, 0, 0, 0, 0, 0] },
  { id: "sundry", label: "Sundry expenses", type: "expense", values: Array(12).fill(0) },
];

const property = {
  owner: "Christie-David Family Super Fund",
  address: "4 Monash Court, Durack NT 0830",
  bank: "Bluebay",
  weeklyRent: INITIAL_WEEKLY_RENT,
  interestRate: INITIAL_INTEREST_RATE,
  loanAmount: INITIAL_LOAN_AMOUNT,
  manager: "Nida Billa @ Billy Nida Realty Pty Ltd",
};

const formatCurrency = (value: number) => value === 0 ? "$0" : value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;

const CashflowTracker = () => {
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState(7);
  const [rows, setRows] = useState<CashflowRow[]>(initialRows);
  const [propertyDetails, setPropertyDetails] = useState(property);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((sum, row) => sum + row.values.reduce((a, b) => a + b, 0), 0);
    const expensesByMonth = months.map((_, i) => rows.filter((r) => r.type === "expense").reduce((sum, row) => sum + row.values[i], 0));
    const incomeByMonth = rows.find((r) => r.type === "income")?.values || [];
    const expenses = expensesByMonth.reduce((a, b) => a + b, 0);
    return { income, expenses, net: income - expenses, holdingCost: Math.max(expenses - income, 0), incomeByMonth, expensesByMonth };
  }, [rows]);

  const updateRow = (rowId: string, updates: Partial<CashflowRow>) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...updates } : row)));
  };

  const updateValue = (rowId: string, monthIndex: number, value: number) => {
    setRows((current) => current.map((row) => {
      if (row.id !== rowId) return row;
      const nextValues = [...row.values];
      nextValues[monthIndex] = value;
      return { ...row, values: nextValues };
    }));
  };

  const updateWeeklyRent = (rowId: string, weeklyRent: number) => {
    updateRow(rowId, { weeklyRent, values: Array(12).fill(monthlyRentFromWeekly(weeklyRent)) });
  };

  const updateInterestRow = (loanAmount: number, interestRate: number) => {
    updateRow("interest", { values: Array(12).fill(monthlyInterestOnlyCost(loanAmount, interestRate)) });
  };

  const updatePropertyWeeklyRent = (weeklyRent: number) => {
    setPropertyDetails((current) => ({ ...current, weeklyRent }));
    const rentalRow = rows.find((row) => row.type === "income");
    if (rentalRow) {
      updateWeeklyRent(rentalRow.id, weeklyRent);
    }
  };

  const updateLoanAmount = (loanAmount: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(loanAmount, current.interestRate);
      return { ...current, loanAmount };
    });
  };

  const updateInterestRate = (interestRate: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(current.loanAmount, interestRate);
      return { ...current, interestRate };
    });
  };

  const addRow = (type: CashflowRow["type"]) => {
    setRows((current) => [...current, { id: `${type}-${Date.now()}`, label: type === "income" ? "New income" : "New expense", type, values: Array(12).fill(0), ...(type === "income" ? { weeklyRent: 0 } : {}) }]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
  };

  return (
    <div className="min-h-screen bg-background">
      <AdviserActingBanner />
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button onClick={() => navigate("/dashboard")} className="flex min-h-11 items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent/80">
              <ArrowLeft size={18} /> Dashboard
            </button>
            <UserMenu />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-accent">Cashflow Tracker</p>
              <h1 className="text-3xl font-bold md:text-5xl">Rental income and expense tracker</h1>
              <p className="mt-3 max-w-2xl text-sm text-primary-foreground/80 md:text-base">Demo prototype based on the spreadsheet layout, showing month-by-month rental income, deductible expenses and net position.</p>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
              Period ended 30th June 2027
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Home size={16} /> Property details</div>
            <Input value={propertyDetails.address} onChange={(event) => setPropertyDetails((current) => ({ ...current, address: event.target.value }))} className="h-11 text-lg font-bold" />
            <Input value={propertyDetails.owner} onChange={(event) => setPropertyDetails((current) => ({ ...current, owner: event.target.value }))} className="mt-2 h-10 text-sm font-semibold" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <EditableInfo icon={Building2} label="Manager" value={propertyDetails.manager} onChange={(value) => setPropertyDetails((current) => ({ ...current, manager: value }))} />
              <EditableInfo icon={Banknote} label="Bank" value={propertyDetails.bank} onChange={(value) => setPropertyDetails((current) => ({ ...current, bank: value }))} />
            </div>
          </div>
          <Metric label="Rental income" value={formatCurrency(totals.income)} icon={Banknote} />
          <Metric label="Total expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} />
          <EditableMetric label="Total loan amount" value={propertyDetails.loanAmount} icon={Banknote} onChange={updateLoanAmount} />
          <EditableMetric label="Interest rate" value={propertyDetails.interestRate} icon={Percent} suffix="%" step="0.01" onChange={updateInterestRate} />
          <EditableMetric label="Weekly rent" value={propertyDetails.weeklyRent} icon={Home} onChange={updatePropertyWeeklyRent} />
          <Metric label="Yearly holding cost" value={formatCurrency(totals.holdingCost)} icon={CalendarDays} highlight={totals.holdingCost > 0} />
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Monthly cashflow worksheet</h2>
              <p className="text-sm text-muted-foreground">Edit weekly rents, row labels and monthly values directly in the worksheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => addRow("income")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Income row</button>
              <button onClick={() => addRow("expense")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Expense row</button>
              <div className="text-sm font-semibold text-accent">Net YTD {formatCurrency(totals.net)}</div>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1400px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                   <th className="sticky left-0 z-20 min-w-72 bg-muted px-4 py-3 text-left font-bold text-foreground shadow-sm">Cashflow item</th>
                  {months.map((month, i) => (
                    <th key={month} className="px-3 py-3 text-right">
                      <button onClick={() => setActiveMonth(i)} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${activeMonth === i ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"}`}>
                        {month}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-bold text-foreground">Total</th>
                  <th className="px-3 py-3 text-right font-bold text-foreground">Remove</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 hover:bg-muted/30">
                    <td className="sticky left-0 z-20 min-w-72 bg-card px-4 py-3 font-medium text-foreground shadow-sm">
                      <Input value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} className="h-9 min-w-56 bg-card font-semibold" />
                    </td>
                    {row.values.map((value, i) => (
                      <td key={i} className={`px-3 py-3 text-right tabular-nums ${activeMonth === i ? "bg-accent/10 font-bold text-foreground" : "text-muted-foreground"}`}>
                        <Input type="number" min="0" value={value || ""} onChange={(event) => updateValue(row.id, i, Number(event.target.value) || 0)} className="ml-auto h-9 w-24 text-right tabular-nums" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{formatCurrency(row.values.reduce((a, b) => a + b, 0))}</td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => removeRow(row.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${row.label}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                <SummaryRow label="Total Expenses" values={totals.expensesByMonth} total={totals.expenses} />
                <SummaryRow label="Net Profit / (Loss)" values={totals.incomeByMonth.map((v, i) => v - totals.expensesByMonth[i])} total={totals.net} />
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

const Info = ({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon size={14} /> {label}</div>
    <div className="text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const EditableInfo = ({ icon: Icon, label, value, onChange, type = "text", suffix }: { icon: typeof Home; label: string; value: string | number; onChange: (value: string) => void; type?: string; suffix?: string }) => (
  <div className="rounded-lg bg-muted/40 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon size={14} /> {label}</div>
    <div className="flex items-center gap-2">
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 bg-card text-sm font-semibold" />
      {suffix ? <span className="text-sm font-semibold text-muted-foreground">{suffix}</span> : null}
    </div>
  </div>
);

const Metric = ({ icon: Icon, label, value, highlight = false, className = "" }: { icon: typeof Home; label: string; value: string; highlight?: boolean; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
  </div>
);

const EditableMetric = ({ icon: Icon, label, value, onChange, suffix, step = "1" }: { icon: typeof Home; label: string; value: number; onChange: (value: number) => void; suffix?: string; step?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-1 flex items-center gap-2">
      <Input type="number" min="0" step={step} value={value === 0 ? "" : value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-11 text-2xl font-bold tabular-nums" />
      {suffix ? <span className="text-xl font-bold text-muted-foreground">{suffix}</span> : null}
    </div>
  </div>
);

const SummaryRow = ({ label, values, total }: { label: string; values: number[]; total: number }) => (
  <tr className="border-t-2 border-border bg-accent/10 font-bold">
    <td className="sticky left-0 z-20 min-w-72 bg-card px-4 py-3 text-foreground shadow-sm">{label}</td>
    {values.map((value, i) => <td key={i} className="px-3 py-3 text-right tabular-nums text-foreground">{formatCurrency(value)}</td>)}
    <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(total)}</td>
    <td className="px-3 py-3" />
  </tr>
);

export default CashflowTracker;