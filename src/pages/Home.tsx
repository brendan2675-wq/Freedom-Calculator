import { useNavigate } from "react-router-dom";
import { Home, DollarSign, TrendingUp, BarChart3, UserCircle, Building2, ArrowUpRight, Landmark, PieChart, MapPin, ChevronRight, RotateCcw, Target, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import AuthFlow from "@/components/AuthFlow";

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
  {
    title: "SMSF Strategy",
    description: "Manage your self-managed super fund property",
    icon: Landmark,
    route: null,
  },
  {
    title: "Specific $ Goal",
    description: "Set and track a custom dollar target",
    icon: Target,
    route: null,
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState(() => localStorage.getItem("client-name") || "Client Name");
  const [authOpen, setAuthOpen] = useState(false);
  const handleSetClientName = (name: string) => {
    setClientName(name);
    localStorage.setItem("client-name", name);
  };

  const { hasPpor, hasInvestments, isFreshUser } = useMemo(() => {
    let hasPpor = false;
    let hasInvestments = false;
    try {
      const pporRaw = localStorage.getItem("portfolio-ppor");
      if (pporRaw) {
        const p = JSON.parse(pporRaw);
        hasPpor = !!(p && (p.estimatedValue > 0 || p.loanBalance > 0));
      }
    } catch {}
    try {
      const propsRaw = localStorage.getItem("portfolio-properties");
      if (propsRaw) {
        const arr = JSON.parse(propsRaw);
        hasInvestments = Array.isArray(arr) && arr.length > 0;
      }
    } catch {}
    return { hasPpor, hasInvestments, isFreshUser: !hasPpor && !hasInvestments };
  }, []);

  // Show 3-part welcome toast on first visit only
  useEffect(() => {
    if (localStorage.getItem("welcome-toast-seen")) return;
    const t1 = setTimeout(() => {
      toast("✨ Welcome to Atelier Wealth", {
        description: "Build your property strategy in three steps — at your own pace.",
        duration: 6000,
      });
    }, 600);
    const t2 = setTimeout(() => {
      toast("🏠 Step 1 — Add any properties you own", {
        description: "Got an owner-occupied home or investments? Add what you have. No properties yet? You can still plan ahead.",
        duration: 7000,
      });
    }, 3200);
    const t3 = setTimeout(() => {
      toast("🎯 Step 2 — Plan future buys & set a goal", {
        description: "Add proposed purchases and choose a payoff target — we'll model the strategy for you.",
        duration: 7000,
        action: {
          label: "Get started",
          onClick: () => navigate("/portfolio"),
        },
      });
      localStorage.setItem("welcome-toast-seen", "1");
    }, 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [navigate]);


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-6 md:py-14">
          {/* Top bar: brand + actions */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <p className="text-accent text-lg tracking-wider">Atelier Wealth</p>
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => {
                  if (window.confirm("Reset all data to defaults? This cannot be undone.")) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
                aria-label="Reset data"
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <div className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => setAuthOpen(true)}
                  className="text-accent hover:text-accent/80 transition-colors"
                  aria-label="Profile"
                >
                  <UserCircle size={36} className="md:w-11 md:h-11" />
                </button>
                <AuthFlow open={authOpen} onOpenChange={setAuthOpen} clientName={clientName} setClientName={handleSetClientName} />
                <input
                  value={clientName}
                  onChange={(e) => handleSetClientName(e.target.value)}
                  className="text-center text-xs md:text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-24 md:w-40"
                  placeholder="Client name"
                />
              </div>
            </div>
          </div>
          {/* Title */}
          <h1 className="text-2xl md:text-5xl font-bold mb-1 md:mb-3">
            Your Dashboard
          </h1>
          <p className="text-accent text-base md:text-xl font-light">
            Your property wealth strategy at a glance
          </p>
        </div>
      </header>

      {/* Tiles */}
      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* Welcome guidance is now delivered via a 3-part toast on first visit */}

        {/* Portfolio button - compact on mobile */}
        <div className="max-w-5xl mx-auto mb-4 md:mb-6">
          <button
            onClick={() => navigate("/portfolio")}
            className="group w-full bg-card rounded-2xl shadow-md border-2 border-border hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer text-left transition-all flex items-center md:flex-col md:items-center md:justify-center gap-4 md:gap-5 p-4 md:py-8 overflow-hidden"
          >
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/15 transition-colors shrink-0">
              <PieChart size={28} className="md:hidden text-accent" />
              <PieChart size={40} className="hidden md:block text-accent" />
            </div>
            <div className="md:text-center flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-0.5 md:mb-1">Your Portfolio</h2>
              <p className="text-xs md:text-sm text-muted-foreground">View and manage your full property portfolio</p>
            </div>
            <div className="flex items-center gap-1 text-accent text-xs font-medium opacity-50 group-hover:opacity-100 transition-opacity shrink-0">
              Open <ChevronRight size={14} />
            </div>
          </button>
        </div>

        {/* Goal tiles — 2-col grid on all sizes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const isActive = !!tile.route;
            return (
              <button
                key={tile.title}
                onClick={() => tile.route && navigate(tile.route)}
                disabled={!isActive}
                className={`group relative bg-card rounded-2xl shadow-md border-2 p-4 md:p-6 text-left transition-all flex flex-col gap-2 md:gap-3 min-h-[120px] md:min-h-[150px] ${
                  isActive
                    ? "border-border hover:border-accent hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                    : "border-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-accent/10" : "bg-muted"
                }`}>
                  <Icon size={20} className={`md:hidden ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                  <Icon size={24} className={`hidden md:block ${isActive ? "text-accent" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h2 className="text-sm md:text-lg font-bold text-foreground mb-0.5 md:mb-1">{tile.title}</h2>
                  <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{tile.description}</p>
                </div>
                {!isActive && (
                  <span className="absolute top-2 right-2 md:top-3 md:right-3 text-[9px] md:text-[10px] font-semibold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-muted text-muted-foreground">
                    Soon
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
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