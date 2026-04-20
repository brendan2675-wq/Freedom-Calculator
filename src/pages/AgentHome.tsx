import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, LogOut, FileText, ChevronRight, User, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSavedScenarios, applyScenarioToStorage } from "@/lib/scenarioManager";
import { listAgents } from "@/lib/clients";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const AgentHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Match agent by email to a record in the agents directory
  const myAgentId = useMemo(() => {
    if (!user) return null;
    const a = listAgents().find((x) => x.email.toLowerCase() === user.email.toLowerCase());
    return a?.id || null;
  }, [user]);

  const sharedScenarios = useMemo(() => {
    if (!myAgentId) return [];
    return getSavedScenarios().filter((s) => s.sharedAgentIds?.includes(myAgentId));
  }, [myAgentId]);

  const open = (id: string) => {
    const s = getSavedScenarios().find((x) => x.id === id);
    if (!s) return;
    applyScenarioToStorage(s.state);
    localStorage.setItem("active-scenario-id", s.id);
    navigate(`/portfolio?readonly=1`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-accent text-lg tracking-wider">Atelier Wealth</p>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent border border-accent/30">
                Agent — Read-only
              </span>
              <span className="text-sm text-accent/90">{user?.name}</span>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold">G'day {user?.name?.split(" ")[0] || "there"}</h1>
          <p className="text-accent text-sm md:text-base mt-1 font-light">
            Scenarios shared with you for review
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 max-w-3xl">
        <div className="bg-card border-2 border-border rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-accent" />
            <h2 className="text-base font-bold text-foreground">Shared scenarios</h2>
          </div>
          {!myAgentId ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Your agent profile isn't set up yet. Ask your adviser to add you to the agents directory using <span className="font-medium text-foreground">{user?.email}</span>.
            </p>
          ) : sharedScenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nothing shared with you yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {sharedScenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => open(s.id)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-muted/30 -mx-2 px-2 rounded-lg"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    {s.type === "smsf" ? <Building2 size={16} className="text-accent" /> : <User size={16} className="text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Updated {formatDate(s.savedAt)} • Read-only
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AgentHome;
