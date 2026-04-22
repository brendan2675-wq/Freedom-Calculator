import { useEffect, useMemo, useState } from "react";
import { Eye, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getActiveScenario, saveActiveScenarioFromWorkingState } from "@/lib/scenarioManager";
import { getRole } from "@/lib/auth";
import { getClient } from "@/lib/clients";
import { Button } from "@/components/ui/button";

interface ScenarioContextBannerProps {
  readOnly?: boolean;
  compact?: boolean;
}

const formatSaved = (iso?: string) => {
  if (!iso) return "Not saved yet";
  return `${new Date(iso).toLocaleDateString()} ${new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const ScenarioContextBanner = ({ readOnly = false, compact = false }: ScenarioContextBannerProps) => {
  const [scenario, setScenario] = useState(() => getActiveScenario());
  const role = getRole();

  useEffect(() => {
    const sync = () => setScenario(getActiveScenario());
    window.addEventListener("active-scenario-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("active-scenario-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const clientName = useMemo(() => scenario?.clientId ? getClient(scenario.clientId)?.name : scenario?.state.clientName, [scenario]);

  if (!scenario) return null;

  const handleSave = () => {
    if (readOnly || role === "agent") return;
    const { scenario: updated, conflict } = saveActiveScenarioFromWorkingState();
    if (!updated) return toast.error("No active scenario to update");
    setScenario(updated);
    if (conflict) toast.warning("This scenario changed after you opened it. Your latest save has been applied.");
    toast.success(`Updated "${updated.name}"`);
  };

  return (
    <section className={`rounded-xl border border-border bg-card shadow-sm ${compact ? "p-3" : "p-4 md:p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {readOnly || role === "agent" ? <Eye size={14} className="text-accent" /> : <ShieldCheck size={14} className="text-accent" />}
            {readOnly || role === "agent" ? "Read-only scenario" : "You are editing"}
          </div>
          <h2 className="truncate text-lg font-bold text-foreground">{scenario.name}</h2>
          <p className="text-sm text-muted-foreground">
            {clientName || "Unassigned client"} · Last updated {scenario.lastEditedByName ? `by ${scenario.lastEditedByName}` : ""} {formatSaved(scenario.savedAt)}
          </p>
        </div>
        {!readOnly && role !== "agent" && (
          <Button size="sm" onClick={handleSave} className="min-h-11 gap-2 self-start sm:self-auto">
            <Save size={14} /> Update scenario
          </Button>
        )}
      </div>
    </section>
  );
};

export default ScenarioContextBanner;
