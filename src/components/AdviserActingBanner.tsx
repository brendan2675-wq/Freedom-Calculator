import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, UserCog } from "lucide-react";
import { toast } from "sonner";
import { getRole } from "@/lib/auth";
import { getScenario, saveActiveScenarioFromWorkingState } from "@/lib/scenarioManager";

export interface ActingAsContext {
  clientId: string;
  scenarioId: string;
  clientName: string;
  scenarioName: string;
}

const KEY = "adviser-acting-as";

export function getActingAs(): ActingAsContext | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActingAsContext) : null;
  } catch {
    return null;
  }
}

export function setActingAs(ctx: ActingAsContext) {
  localStorage.setItem(KEY, JSON.stringify(ctx));
  window.dispatchEvent(new Event("acting-as-changed"));
}

export function clearActingAs() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("active-scenario-id");
  window.dispatchEvent(new Event("acting-as-changed"));
}

const AdviserActingBanner = () => {
  const navigate = useNavigate();
  const [ctx, setCtx] = useState<ActingAsContext | null>(getActingAs());

  useEffect(() => {
    const sync = () => setCtx(getActingAs());
    window.addEventListener("acting-as-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("acting-as-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!ctx) return null;
  if (getRole() !== "adviser") return null;

  const handleSave = () => {
    const { scenario: updated, conflict } = saveActiveScenarioFromWorkingState();
    if (updated && updated.id === ctx.scenarioId) {
      if (conflict) toast.warning("Saved over a newer version of this scenario");
      toast.success(`Saved to ${ctx.clientName}'s scenario`);
    } else {
      toast.error("Could not save — scenario not found");
    }
  };

  const handleExit = () => {
    clearActingAs();
    navigate("/adviser");
  };

  // Verify scenario still exists; if not, auto-clear
  const scenario = getScenario(ctx.scenarioId);
  if (!scenario) {
    clearActingAs();
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-accent text-accent-foreground border-b border-accent/40 shadow-sm">
      <div className="container mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <UserCog size={16} className="shrink-0" />
        <p className="text-xs md:text-sm flex-1 min-w-0">
          Editing <span className="font-semibold">{ctx.clientName}</span>'s scenario
          <span className="opacity-80"> — {ctx.scenarioName}</span>
          {scenario.lastEditedByName && (
            <span className="opacity-70"> · Last updated by {scenario.lastEditedByName}</span>
          )}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-accent-foreground/10 hover:bg-accent-foreground/20 transition-colors"
          >
            <Save size={13} /> Save changes
          </button>
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border border-accent-foreground/30 hover:bg-accent-foreground/10 transition-colors"
          >
            <X size={13} /> Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdviserActingBanner;
