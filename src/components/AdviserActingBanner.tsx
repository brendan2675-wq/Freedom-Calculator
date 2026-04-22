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
    <div className="sticky top-2 z-50 pointer-events-none">
      <div className="container mx-auto px-4 flex justify-end">
        <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-xl border border-accent/30 bg-card/95 px-3 py-2 text-foreground shadow-md backdrop-blur-sm">
        <UserCog size={14} className="shrink-0 text-accent" />
        <p className="hidden min-w-0 max-w-[56vw] truncate text-xs md:block">
          Editing <span className="font-semibold">{ctx.clientName}</span>'s scenario
          <span className="opacity-80"> — {ctx.scenarioName}</span>
          {scenario.lastEditedByName && (
            <span className="opacity-70"> · Last updated by {scenario.lastEditedByName}</span>
          )}
        </p>
        <p className="max-w-[42vw] truncate text-xs font-semibold md:hidden">{ctx.scenarioName}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleSave}
            className="flex min-h-9 items-center gap-1.5 rounded-md bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/15"
          >
            <Save size={13} /> Save changes
          </button>
          <button
            onClick={handleExit}
            className="flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <X size={13} /> Exit
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdviserActingBanner;
