import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Building2, Landmark, TrendingUp, Home } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import ExistingProperties from "@/components/ExistingProperties";
import type { ExistingProperty } from "@/types/property";

const Portfolio = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("Client Name");
  const [properties, setProperties] = useState<ExistingProperty[]>([]);
  const [pporValue, setPporValue] = useState(2750000);
  const [pporLoan, setPporLoan] = useState(450000);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      try { setProperties(JSON.parse(stored)); } catch {}
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "portfolio-properties" && e.newValue) {
        try { setProperties(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Sync back to localStorage when properties change
  const handleSetProperties = (p: ExistingProperty[]) => {
    setProperties(p);
    localStorage.setItem("portfolio-properties", JSON.stringify(p));
  };

  const totals = useMemo(() => {
    const investmentValue = properties.reduce((s, p) => s + p.estimatedValue, 0);
    const investmentLoan = properties.reduce((s, p) => s + p.loanBalance, 0);
    const investmentEquity = properties.reduce((s, p) => s + Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance), 0);
    const totalValue = pporValue + investmentValue;
    const totalLoan = pporLoan + investmentLoan;
    const pporEquity = Math.max(0, (pporValue * 0.8) - pporLoan);
    const totalEquity = pporEquity + investmentEquity;
    return { totalValue, totalLoan, totalEquity };
  }, [properties, pporValue, pporLoan]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="w-14 h-14 rounded-xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent hover:bg-accent/25 hover:border-accent/50 transition-all"
              aria-label="Back to Dashboard"
            >
              <LayoutDashboard size={32} />
            </button>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3">Your Portfolio</h1>
              <p className="text-accent text-lg md:text-xl font-light">
                View and manage your full property portfolio
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <p className="text-accent text-sm tracking-wider mb-1">Atelier Wealth</p>
            <UserCircle size={44} className="text-accent" />
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="text-center text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-32 md:w-40"
              placeholder="Client name"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-10">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Building2, label: "Total Portfolio Value", value: `$${totals.totalValue.toLocaleString()}`, color: "text-foreground" },
            { icon: Landmark, label: "Total Loans", value: `$${totals.totalLoan.toLocaleString()}`, color: "text-destructive" },
            { icon: TrendingUp, label: "Available Equity (80%)", value: `$${totals.totalEquity.toLocaleString()}`, color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col items-center gap-2">
              <stat.icon size={24} className="text-accent" />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Owner Occupied Property */}
        <section>
          <div className="gold-underline pb-2 mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
              <Home size={26} strokeWidth={2.25} className="text-accent" />
              Owner Occupied Property
            </h2>
          </div>
          <div className="bg-card rounded-xl p-6 border-2 border-border shadow-sm max-w-xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-muted-foreground text-[11px] block mb-1">Property Value</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="text"
                    value={pporValue.toLocaleString()}
                    onChange={(e) => {
                      const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                      if (!isNaN(val)) setPporValue(val);
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-muted-foreground text-[11px] block mb-1">Loan Balance</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="text"
                    value={pporLoan.toLocaleString()}
                    onChange={(e) => {
                      const val = Number(e.target.value.replace(/[^0-9]/g, ""));
                      if (!isNaN(val)) setPporLoan(val);
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-muted-foreground text-[11px] block mb-1">Equity (80% LVR)</label>
                <p className="text-accent font-bold text-sm py-2">
                  ${Math.max(0, (pporValue * 0.8) - pporLoan).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Investment Properties Carousel */}
        <ExistingProperties
          properties={properties}
          setProperties={handleSetProperties}
          targetMonth={2}
          targetYear={2036}
          growthRate={6}
        />
      </main>
    </div>
  );
};

export default Portfolio;
