import { useNavigate } from "react-router-dom";
import { LayoutDashboard, UserCircle } from "lucide-react";
import { useState } from "react";

const Portfolio = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("Client Name");

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

      <main className="container mx-auto px-4 py-12">
        <p className="text-muted-foreground text-center">Portfolio details coming soon.</p>
      </main>
    </div>
  );
};

export default Portfolio;
