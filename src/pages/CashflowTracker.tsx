import { useMemo, useState } from "react";
import { ArrowLeft, Banknote, Building2, CalendarDays, ExternalLink, Home, Percent, Plus, Trash2, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdviserActingBanner from "@/components/AdviserActingBanner";
import UserMenu from "@/components/UserMenu";
import { Input } from "@/components/ui/input";

const months = ["Jul-25", "Aug-25", "Sep-25", "Oct-25", "Nov-25", "Dec-25", "Jan-26", "Feb-26", "Mar-26", "Apr-26", "May-26", "Jun-26"];

type CashflowRow = {
  id: string;
  label: string;
  type: "income" | "expense";
  values: number[];
  weeklyRent?: number;
};

const monthlyRentFromWeekly = (weeklyRent: number) => Math.round((weeklyRent * 52) / 12);

const initialRows: CashflowRow[] = [
  { id: "rental-income", label: "Rental income", type: "income", weeklyRent: 600, values: Array(12).fill(monthlyRentFromWeekly(600)) },
  { id: "advertising", label: "Advertising for tenants", type: "expense", values: Array(12).fill(0) },
  { id: "bank-fees", label: "Bank fees", type: "expense", values: Array(12).fill(0) },
  { id: "body-corporate", label: "Body corporate fees", type: "expense", values: Array(12).fill(0) },
  { id: "borrowing", label: "Borrowing expenses", type: "expense", values: Array(12).fill(0) },
  { id: "cleaning", label: "Cleaning", type: "expense", values: Array(12).fill(0) },
  { id: "council", label: "Council rates", type: "expense", values: Array(12).fill(0) },
  { id: "depreciation", label: "Depreciation on plant", type: "expense", values: Array(12).fill(0) },
  { id: "gardening", label: "Gardening / lawn mowing", type: "expense", values: Array(12).fill(0) },
  { id: "insurance", label: "Insurance", type: "expense", values: [189, 189, 189, 189, 189, 189, 189, 189, 0, 0, 0, 0] },
  { id: "interest", label: "Interest on Bluebay loan", type: "expense", values: [0, 2722, 2688, 2533, 2616, 2529, 3002, 0, 0, 0, 0, 0] },
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
  owner: "Nunki Sigma Pty Ltd ATF Nunki Bare Trust ATF Christie-David Super Investments Pty Ltd ATF Christie-David Family Super Fund",
  address: "4 Monash Court, Durack NT 0830",
  bank: "Bluebay",
  bsb: "636-380",
  account: "400173265",
  weeklyRent: 600,
  interestRate: 6.54,
  manager: "Nida Billa @ Billy Nida Realty Pty Ltd",
};

const formatCurrency = (value: number) => value === 0 ? "$0" : value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;

const CashflowTracker = () => {
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState(7);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((sum, row) => sum + row.values.reduce((a, b) => a + b, 0), 0);
    const expensesByMonth = months.map((_, i) => rows.filter((r) => r.type === "expense").reduce((sum, row) => sum + row.values[i], 0));
    const incomeByMonth = rows.find((r) => r.type === "income")?.values || [];
    const expenses = expensesByMonth.reduce((a, b) => a + b, 0);
    return { income, expenses, net: income - expenses, incomeByMonth, expensesByMonth };
  }, []);

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
              Period ended 30th June 2026
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm md:col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Home size={16} /> Property details</div>
            <h2 className="text-lg font-bold text-foreground">{property.address}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{property.owner}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info icon={Building2} label="Manager" value={property.manager} />
              <Info icon={Banknote} label="Bank" value={`${property.bank} · ${property.bsb}`} />
              <Info icon={ExternalLink} label="Account" value={property.account} />
              <Info icon={Percent} label="Interest rate" value={`${property.interestRate.toFixed(2)}%`} />
            </div>
          </div>
          <Metric label="Rental income" value={formatCurrency(totals.income)} icon={Banknote} />
          <Metric label="Total expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} />
          <Metric label="Net profit / loss" value={formatCurrency(totals.net)} icon={CalendarDays} highlight={totals.net < 0} />
          <Metric label="Weekly rent" value={formatCurrency(property.weeklyRent)} icon={Home} />
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Monthly cashflow worksheet</h2>
              <p className="text-sm text-muted-foreground">Tap a month to highlight the active reporting column.</p>
            </div>
            <div className="text-sm font-semibold text-accent">Net YTD {formatCurrency(totals.net)}</div>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1180px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left font-bold text-foreground">Month</th>
                  {months.map((month, i) => (
                    <th key={month} className="px-3 py-3 text-right">
                      <button onClick={() => setActiveMonth(i)} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${activeMonth === i ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"}`}>
                        {month}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-bold text-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border/70 hover:bg-muted/30">
                    <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium text-foreground">{row.label}</td>
                    {row.values.map((value, i) => (
                      <td key={i} className={`px-3 py-3 text-right tabular-nums ${activeMonth === i ? "bg-accent/10 font-bold text-foreground" : "text-muted-foreground"}`}>{value ? formatCurrency(value) : ""}</td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{formatCurrency(row.values.reduce((a, b) => a + b, 0))}</td>
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

const Metric = ({ icon: Icon, label, value, highlight = false }: { icon: typeof Home; label: string; value: string; highlight?: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
  </div>
);

const SummaryRow = ({ label, values, total }: { label: string; values: number[]; total: number }) => (
  <tr className="border-t-2 border-border bg-accent/10 font-bold">
    <td className="sticky left-0 z-10 bg-accent/10 px-4 py-3 text-foreground">{label}</td>
    {values.map((value, i) => <td key={i} className="px-3 py-3 text-right tabular-nums text-foreground">{formatCurrency(value)}</td>)}
    <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(total)}</td>
  </tr>
);

export default CashflowTracker;