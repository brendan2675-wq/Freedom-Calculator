import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { getActiveScenario, saveActiveScenarioFromWorkingState } from "@/lib/scenarioManager";
import { getRole, getUser } from "@/lib/auth";
import { getClient } from "@/lib/clients";
import { Button } from "@/components/ui/button";
import { clearActingAs } from "@/components/AdviserActingBanner";

interface ScenarioContextBannerProps {
  readOnly?: boolean;
  compact?: boolean;
}

const formatSaved = (iso?: string) => {
  if (!iso) return "Not saved yet";
  return `${new Date(iso).toLocaleDateString()} ${new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

const ScenarioContextBanner = ({ readOnly = false, compact = false }: ScenarioContextBannerProps) => {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(() => getActiveScenario());
  const role = getRole();
  const user = getUser();

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
  const displayClientName = clientName && clientName !== "Client Name" ? clientName : "Unassigned client";

  if (!scenario) return null;
  const ownsOrMatchesClient = role === "adviser" || role === "agent" || !scenario.clientId || !clientName || clientName === user?.name;
  if (role === "client" && !ownsOrMatchesClient && scenario.ownerId !== user?.id) return null;

  const handleSave = () => {
    if (readOnly || role === "agent") return;
    const { scenario: updated, conflict } = saveActiveScenarioFromWorkingState();
    if (!updated) return toast.error("No active scenario to update");
    setScenario(updated);
    if (conflict) toast.warning("This scenario changed after you opened it. Your latest save has been applied.");
    toast.success(`Updated "${updated.name}"`);
  };

  const handleExitAdviserMode = () => {
    clearActingAs();
    navigate("/adviser");
  };

  return (
    <section className={`rounded-xl border border-border bg-card shadow-sm ${compact ? "p-3" : "p-4 md:p-5"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {readOnly || role === "agent" ? <Eye size={14} className="text-accent" /> : <ShieldCheck size={14} className="text-accent" />}
            {readOnly || role === "agent" ? "Read-only scenario" : role === "adviser" ? "Adviser editing" : "Current scenario"}
          </div>
          <h2 className="truncate text-lg font-bold text-foreground">{scenario.name}</h2>
          <p className="text-sm text-muted-foreground">
            {displayClientName} · Last updated {scenario.lastEditedByName ? `by ${scenario.lastEditedByName}` : ""} {formatSaved(scenario.savedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          {!readOnly && role !== "agent" && (
            <Button size="sm" onClick={handleSave} className="min-h-11 gap-2">
              <Save size={14} /> Update scenario
            </Button>
          )}
          {role === "adviser" && (
            <Button size="sm" variant="outline" onClick={handleExitAdviserMode} className="min-h-11 gap-2">
              <ArrowLeft size={14} /> Adviser dashboard
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default ScenarioContextBanner;
