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
            {/* Top section with gradient accent bar */}
            <div className="relative px-8 pt-8 pb-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/60 to-transparent" />
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-accent/10 mb-5">
                <PieChart size={28} className="text-accent" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Portfolio</h2>
              <p className="text-sm text-muted-foreground">View and manage your full property portfolio</p>
            </div>

            {/* Mini property cards */}
            <div className="px-8 flex-1 flex flex-col gap-2.5">
              {[
                { name: "PPOR — Parramatta", value: "$1.2M", icon: Home },
                { name: "IP1 — Wollongong", value: "$820K", icon: Building2 },
                { name: "IP2 — Newcastle", value: "$740K", icon: Building2 },
              ].map((prop) => (
                <div
                  key={prop.name}
                  className="flex items-center gap-3 rounded-xl bg-muted/50 border border-border/60 px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <prop.icon size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{prop.name}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground">{prop.value}</span>
                </div>
              ))}
            </div>

            {/* Bottom stats bar */}
            <div className="px-8 py-5 mt-auto">
              <div className="flex items-center justify-between border-t border-border/60 pt-4">
                <div className="flex items-center gap-1.5">
                  <Landmark size={14} className="text-accent" />
                  <span className="text-xs text-muted-foreground">Total Value</span>
                  <span className="text-sm font-bold text-foreground ml-1">$2.76M</span>
                </div>
                <div className="flex items-center gap-1 text-accent text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                  View portfolio <ChevronRight size={14} />
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