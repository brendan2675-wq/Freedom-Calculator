import { useNavigate } from "react-router-dom";
import { Home, DollarSign, TrendingUp, BarChart3, UserCircle, Building2, ArrowUpRight, Landmark, PieChart, MapPin, ChevronRight } from "lucide-react";
import { useState } from "react";

const tiles = [
  {
    title: "PPOR Goal",
    description: "Pay off your home in 10 years, not 30",
    icon: Home,
    route: "/ppor-goal",
    accent: true,
  },
  {
    title: "Net Passive",
    description: "Track your passive income targets",
    icon: DollarSign,
    route: null,
  },
  {
    title: "Cashflow Tracker",
    description: "Monitor property cashflow in real time",
    icon: BarChart3,
    route: null,
  },
  {
    title: "Portfolio Value",
    description: "See your total portfolio growth over time",
    icon: TrendingUp,
    route: null,
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("Client Name");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-14 flex items-center justify-between">
          <div>
            <p className="text-accent text-lg tracking-wider mb-4">Atelier Wealth</p>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              Your Dashboard
            </h1>
            <p className="text-accent text-lg md:text-xl font-light">
              Your property wealth strategy at a glance
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
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

      {/* Tiles */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 max-w-5xl mx-auto items-stretch">
          {/* Left — Your Portfolio */}
          <button
            onClick={() => navigate("/portfolio")}
            className="group relative bg-card rounded-2xl shadow-md border-2 border-border hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer text-left transition-all flex flex-col overflow-hidden"
          >
            {/* Header area */}
            <div className="px-7 pt-7 pb-5">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <PieChart size={24} className="text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Portfolio</h2>
              <p className="text-sm text-muted-foreground">View and manage your full property portfolio</p>
            </div>

            {/* Donut-style visual + summary */}
            <div className="px-7 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-6">
                {/* Simple donut ring via SVG */}
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" className="stroke-border" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" className="stroke-accent" strokeDasharray="43 57" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" className="stroke-accent/40" strokeDasharray="30 70" strokeDashoffset="-43" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3.5" className="stroke-accent/20" strokeDasharray="27 73" strokeDashoffset="-73" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold text-foreground leading-tight">$2.76M</span>
                    <span className="text-[9px] text-muted-foreground">Total</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "PPOR", value: "$1.2M", pct: "43%" },
                    { label: "IP — Wollongong", value: "$820K", pct: "30%" },
                    { label: "IP — Newcastle", value: "$740K", pct: "27%" },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        i === 0 ? "bg-accent" : i === 1 ? "bg-accent/40" : "bg-accent/20"
                      }`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-xs font-semibold text-foreground ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="px-7 py-4 mt-auto border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">3 properties</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">63% equity</span>
                </div>
                <div className="flex items-center gap-1 text-accent text-xs font-medium opacity-50 group-hover:opacity-100 transition-opacity">
                  Open <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </button>

          {/* Right — Goal tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            {tiles.map((tile) => {
              const Icon = tile.icon;
              const isActive = !!tile.route;
              return (
                <button
                  key={tile.title}
                  onClick={() => tile.route && navigate(tile.route)}
                  disabled={!isActive}
                  className={`group relative bg-card rounded-2xl shadow-md border-2 p-6 text-left transition-all flex flex-col gap-3 min-h-[150px] ${
                    isActive
                      ? "border-border hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                      : "border-border/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive ? "bg-accent/10" : "bg-muted"
                  }`}>
                    <Icon size={24} className={isActive ? "text-accent" : "text-muted-foreground"} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">{tile.title}</h2>
                    <p className="text-xs text-muted-foreground">{tile.description}</p>
                  </div>
                  {!isActive && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute bottom-3 right-3 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Open →
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;