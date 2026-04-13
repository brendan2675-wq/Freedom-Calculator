import { useState } from "react";
import { UserCircle, LayoutDashboard, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthFlow from "@/components/AuthFlow";
import ScenarioManager from "@/components/ScenarioManager";
import type { ScenarioState } from "@/lib/scenarioManager";

interface HeaderProps {
  clientName: string;
  setClientName: (v: string) => void;
  getCurrentState?: () => ScenarioState;
  loadState?: (state: ScenarioState) => void;
}

const Header = ({ clientName, setClientName }: HeaderProps) => {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  return (
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
            <h1 className="text-3xl md:text-5xl font-bold mb-3">
              PPOR Pay Down Goal
            </h1>
            <p className="text-accent text-lg md:text-xl font-light">
              Pay off your home in 10 years, not 30
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {getCurrentState && loadState && (
            <ScenarioManager getCurrentState={getCurrentState} loadState={loadState} />
          )}
          <button
            onClick={() => {
              if (window.confirm("Reset all data to defaults? This cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
            aria-label="Reset data"
          >
            <RotateCcw size={14} />
            Reset
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="text-accent text-sm tracking-wider mb-1">Atelier Wealth</p>
            <button
              onClick={() => setAuthOpen(true)}
              className="text-accent hover:text-accent/80 transition-colors"
              aria-label="Profile"
            >
              <UserCircle size={44} />
            </button>
            <AuthFlow open={authOpen} onOpenChange={setAuthOpen} clientName={clientName} setClientName={(name) => { setClientName(name); localStorage.setItem("client-name", name); }} />
            <input
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); localStorage.setItem("client-name", e.target.value); }}
              className="text-center text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-32 md:w-40"
              placeholder="Client name"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
