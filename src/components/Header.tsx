import { RotateCcw } from "lucide-react";
import AppNavigation from "@/components/AppNavigation";
import ScenarioManager from "@/components/ScenarioManager";
import UserMenu from "@/components/UserMenu";
import { getRole } from "@/lib/auth";
import type { ScenarioState } from "@/lib/scenarioManager";

interface HeaderProps {
  getCurrentState?: () => ScenarioState;
  loadState?: (state: ScenarioState) => void;
}

const Header = ({ getCurrentState, loadState }: HeaderProps) => {
  const role = getRole();
  return (
    <header className="bg-header text-primary-foreground">
      <div className="container mx-auto px-4 py-5 md:py-12">
        {/* Top bar: brand + navigation + actions */}
        <div className="flex items-center justify-between mb-3 md:mb-5">
          <p className="text-accent text-sm md:text-lg tracking-wider">Atelier Wealth</p>
          <AppNavigation />
          <div className="flex items-center gap-2 md:gap-4">
            {role !== "client" && getCurrentState && loadState && (
              <ScenarioManager getCurrentState={getCurrentState} loadState={loadState} />
            )}
            <button
              onClick={() => {
                if (window.confirm("Reset all data to defaults? This cannot be undone.\n\nSaved scenarios will be preserved.")) {
                  const savedScenarios = localStorage.getItem("saved-scenarios");
                  localStorage.clear();
                  if (savedScenarios) localStorage.setItem("saved-scenarios", savedScenarios);
                  window.location.reload();
                }
              }}
              className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
              aria-label="Reset data"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <UserMenu />
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
