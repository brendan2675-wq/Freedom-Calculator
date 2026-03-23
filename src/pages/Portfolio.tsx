import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle, Building2, Landmark, Wallet, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { InvestmentTypeIcon } from "@/components/InvestmentTypeIcon";
import type { ExistingProperty } from "@/types/property";

const Portfolio = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("Client Name");
  const [properties, setProperties] = useState<ExistingProperty[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("portfolio-properties");
    if (stored) {
      try {
        setProperties(JSON.parse(stored));
      } catch {}
    }
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "portfolio-properties" && e.newValue) {
        try { setProperties(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const totals = useMemo(() => {
    const totalValue = properties.reduce((s, p) => s + p.estimatedValue, 0);
    const totalLoan = properties.reduce((s, p) => s + p.loanBalance, 0);
    const totalEquity = properties.reduce((s, p) => s + Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance), 0);
    return { totalValue, totalLoan, totalEquity };
  }, [properties]);

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

      <main className="container mx-auto px-4 py-12 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Building2, label: "Portfolio Value", value: `$${totals.totalValue.toLocaleString()}`, color: "text-foreground" },
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

        {/* Property List */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Wallet size={24} className="text-accent" />
            Investment Properties
            <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {properties.length}
            </span>
          </h2>

          {properties.length === 0 ? (
            <div className="bg-card rounded-xl p-12 border border-border text-center">
              <p className="text-muted-foreground">No properties yet. Add properties on the <button onClick={() => navigate("/ppor-goal")} className="text-accent underline hover:text-accent/80">PPOR Goal</button> page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((p) => {
                const equity = Math.max(0, (p.estimatedValue * 0.8) - p.loanBalance);
                return (
                  <div
                    key={p.id}
                    className="bg-card rounded-xl p-5 border-2 border-border hover:border-accent hover:shadow-lg hover:shadow-accent/10 transition-all cursor-pointer"
                    onClick={() => navigate("/ppor-goal")}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <InvestmentTypeIcon type={p.investmentType} size={18} className="text-accent" />
                      <h3 className="font-semibold text-foreground">{p.nickname || "Untitled"}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground text-[11px]">Current Value</span>
                        <p className="font-medium text-foreground">${p.estimatedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px]">Loan Balance</span>
                        <p className="font-medium text-foreground">${p.loanBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px]">Equity (80%)</span>
                        <p className="font-medium text-accent">${equity.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[11px]">Ownership</span>
                        <p className="font-medium text-foreground">{p.ownership === "trust" ? "Trust" : "Personal"}</p>
                      </div>
                    </div>
                    {p.earmarked && (
                      <div className="mt-3 pt-2 border-t border-border/70">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          Sell down {p.sellInYears === 0 ? "now" : `in ${p.sellInYears}yr`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
