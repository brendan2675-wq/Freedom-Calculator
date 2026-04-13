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

const Header = ({ clientName, setClientName, getCurrentState, loadState }: HeaderProps) => {
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  return (
    <header className="bg-header text-primary-foreground">
      <div className="container mx-auto px-4 py-5 md:py-12">
        {/* Top bar: back button + actions */}
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 md:w-14 md:h-14 rounded-xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent hover:bg-accent/25 hover:border-accent/50 transition-all shrink-0"
            aria-label="Back to Dashboard"
          >
            <LayoutDashboard size={22} className="md:hidden" />
            <LayoutDashboard size={32} className="hidden md:block" />
          </button>
          <div className="flex items-center gap-2 md:gap-4">
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
                <UserCircle size={32} className="md:hidden" />
                <UserCircle size={44} className="hidden md:block" />
              </button>
              <AuthFlow open={authOpen} onOpenChange={setAuthOpen} clientName={clientName} setClientName={(name) => { setClientName(name); localStorage.setItem("client-name", name); }} />
              <input
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); localStorage.setItem("client-name", e.target.value); }}
                className="text-center text-xs md:text-sm text-accent bg-transparent border-b border-transparent hover:border-accent/40 focus:border-accent focus:outline-none transition-colors w-20 md:w-40"
                placeholder="Client name"
              />
            </div>
          </div>
        </div>
        {/* Title */}
        <h1 className="text-xl md:text-5xl font-bold mb-1 md:mb-3">
          PPOR Pay Down Goal
        </h1>
        <p className="text-accent text-sm md:text-xl font-light">
          Pay off your home in 10 years, not 30
        </p>
      </div>
    </header>
  );
};

export default Header;
