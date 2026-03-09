import { useNavigate } from "react-router-dom";
import { Home, DollarSign, TrendingUp, BarChart3, UserCircle } from "lucide-react";
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const isActive = !!tile.route;
            return (
              <button
                key={tile.title}
                onClick={() => tile.route && navigate(tile.route)}
                disabled={!isActive}
                className={`group relative bg-card rounded-2xl shadow-md border-2 p-8 text-left transition-all flex flex-col gap-4 min-h-[180px] ${
                  isActive
                    ? "border-border hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    : "border-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-accent/10" : "bg-muted"
                }`}>
                  <Icon size={28} className={isActive ? "text-accent" : "text-muted-foreground"} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{tile.title}</h2>
                  <p className="text-sm text-muted-foreground">{tile.description}</p>
                </div>
                {!isActive && (
                  <span className="absolute top-4 right-4 text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    Coming soon
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-4 right-4 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Open →
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default HomePage;