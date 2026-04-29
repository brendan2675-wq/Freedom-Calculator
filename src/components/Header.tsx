import { LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ScenarioManager from "@/components/ScenarioManager";
import UserMenu from "@/components/UserMenu";
import type { ScenarioState } from "@/lib/scenarioManager";

interface HeaderProps {
  getCurrentState?: () => ScenarioState;
  loadState?: (state: ScenarioState) => void;
}

const Header = ({ getCurrentState, loadState }: HeaderProps) => {
  const navigate = useNavigate();
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
