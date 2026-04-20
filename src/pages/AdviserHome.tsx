import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, ChevronRight, LogOut, User, Users, Briefcase, FileText,
  Edit2, Trash2, Share2, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import {
  listClients, upsertClient, deleteClient,
  listAgents, upsertAgent, deleteAgent,
  type Client, type Agent,
} from "@/lib/clients";
import {
  getSavedScenarios, deleteScenario, applyScenarioToStorage, setScenarioMeta,
  type SavedScenario,
} from "@/lib/scenarioManager";
import ShareWithAgentsDialog from "@/components/ShareWithAgentsDialog";
import { seedDemoData } from "@/lib/demoData";
import { toast } from "sonner";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const sumPortfolioValue = (s: SavedScenario): number => {
  const ppor = s.state?.ppor?.estimatedValue || 0;
  const inv = (s.state?.existingProperties || []).reduce((acc, p: any) => acc + (p?.estimatedValue || 0), 0);
  return ppor + inv;
};

const fmtCurrency = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}k`;

const AdviserHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [scenarios, setScenarios] = useState<SavedScenario[]>(getSavedScenarios);
  const [clients, setClients] = useState<Client[]>(listClients);
  const [agents, setAgents] = useState<Agent[]>(listAgents);
  const [search, setSearch] = useState("");

  const [clientDialog, setClientDialog] = useState<{ open: boolean; client?: Client }>({ open: false });
  const [agentDialog, setAgentDialog] = useState<{ open: boolean; agent?: Agent }>({ open: false });
  const [shareDialog, setShareDialog] = useState<{ open: boolean; scenario?: SavedScenario }>({ open: false });

  const refresh = () => {
    setScenarios(getSavedScenarios());
    setClients(listClients());
    setAgents(listAgents());
  };

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scenarios;
    return scenarios.filter((s) => {
      const client = clients.find((c) => c.id === s.clientId);
      return (
        s.name.toLowerCase().includes(q) ||
        (client?.name || "").toLowerCase().includes(q) ||
        (s.type || "").toLowerCase().includes(q)
      );
    });
  }, [scenarios, clients, search]);

  const openScenario = (s: SavedScenario) => {
    applyScenarioToStorage(s.state);
    localStorage.setItem("active-scenario-id", s.id);
    navigate("/");
  };

  const startNew = () => {
    localStorage.removeItem("active-scenario-id");
    localStorage.setItem("new-scenario-type", "individual");
    navigate("/");
  };

  const handleDeleteScenario = (id: string) => {
    if (!confirm("Delete this scenario?")) return;
    deleteScenario(id);
    refresh();
    toast.success("Scenario deleted");
  };

  const sharedCount = (agentId: string) =>
    scenarios.filter((s) => s.sharedAgentIds?.includes(agentId)).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-accent text-lg tracking-wider">Atelier Wealth</p>
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                Adviser
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
          <p className="text-accent text-sm md:text-base mt-1 font-light">Manage clients, scenarios, and agent access</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
          <ActionCard
            icon={<Plus size={22} className="text-accent" />}
            title="Individual Scenario"
            desc="Build new portfolios for clients"
            onClick={() => startNew()}
          />
          <ActionCard
            icon={<FileText size={22} className="text-accent" />}
            title="Previous Scenario"
            desc={scenarios[0] ? `Resume "${scenarios[0].name}"` : "No scenarios yet"}
            onClick={() => scenarios[0] && openScenario(scenarios[0])}
            disabled={!scenarios[0]}
          />
        </div>

        {/* Recent scenarios with search */}
        <section className="bg-card border-2 border-border rounded-2xl p-4 md:p-5 mb-6">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-base md:text-lg font-bold text-foreground">Your recent scenarios</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const r = seedDemoData(20);
                  refresh();
                  toast.success(`Loaded ${r.clients} demo clients & scenarios`);
                }}
                className="h-9 text-xs"
              >
                Load demo data
              </Button>
              <div className="relative w-48 md:w-64">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {scenarios.length === 0 ? "No scenarios yet — start one above." : "No matches."}
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.slice(0, 8).map((s) => {
                const client = clients.find((c) => c.id === s.clientId);
                return (
                  <div key={s.id} className="flex items-center gap-3 py-3 group">
                    <button
                      onClick={() => openScenario(s)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <User size={16} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {client?.name || "Unassigned"} • {formatDate(s.savedAt)}
                        </p>
                      </div>
                      <div className="hidden md:block text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground">{fmtCurrency(sumPortfolioValue(s))}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Individual
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setShareDialog({ open: true, scenario: s })}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-accent"
                        title="Share with agents"
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteScenario(s.id)}
                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button
                        onClick={() => openScenario(s)}
                        className="p-2 rounded-lg hover:bg-muted text-accent"
                        title="Open"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Tabs: Clients / Agents */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList>
            <TabsTrigger value="clients" className="gap-1.5"><Users size={14} /> Clients ({clients.length})</TabsTrigger>
            <TabsTrigger value="agents" className="gap-1.5"><Briefcase size={14} /> Agents ({agents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-4">
            <div className="bg-card border-2 border-border rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Clients directory</h3>
                <Button size="sm" onClick={() => setClientDialog({ open: true })} className="gap-1.5">
                  <Plus size={14} /> New client
                </Button>
              </div>
              {clients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No clients yet — add your first one.</p>
              ) : (
                <div className="space-y-3">
                  {clients.map((c) => {
                    const clientScenarios = scenarios.filter((s) => s.clientId === c.id);
                    return (
                      <div key={c.id} className="border border-border rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setClientDialog({ open: true, client: c })} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => { if (confirm("Delete client?")) { deleteClient(c.id); refresh(); } }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {clientScenarios.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pl-1">No scenarios assigned.</p>
                        ) : (
                          <div className="space-y-1 pl-1">
                            {clientScenarios.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => openScenario(s)}
                                className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-muted/50 text-xs"
                              >
                                <FileText size={12} className="text-accent" />
                                <span className="font-medium text-foreground flex-1 truncate">{s.name}</span>
                                <span className="text-muted-foreground">{fmtCurrency(sumPortfolioValue(s))}</span>
                                <ChevronRight size={12} className="text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="mt-4">
            <div className="bg-card border-2 border-border rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Agents directory</h3>
                <Button size="sm" onClick={() => setAgentDialog({ open: true })} className="gap-1.5">
                  <Plus size={14} /> New agent
                </Button>
              </div>
              {agents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No agents yet.</p>
              ) : (
                <div className="space-y-2">
                  {agents.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 border border-border rounded-xl p-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <User size={16} className="text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{a.email}{a.agency ? ` • ${a.agency}` : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground"><Eye size={11} className="inline mr-0.5" />{sharedCount(a.id)} shared</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setAgentDialog({ open: true, agent: a })} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => { if (confirm("Delete agent?")) { deleteAgent(a.id); refresh(); } }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Client dialog */}
      <PersonDialog
        open={clientDialog.open}
        onOpenChange={(v) => setClientDialog({ open: v, client: v ? clientDialog.client : undefined })}
        title={clientDialog.client ? "Edit client" : "New client"}
        initial={clientDialog.client}
        onSave={(data) => {
          upsertClient({ id: clientDialog.client?.id, name: data.name, email: data.email, agentIds: clientDialog.client?.agentIds || [] });
          refresh();
          setClientDialog({ open: false });
        }}
      />

      {/* Agent dialog */}
      <PersonDialog
        open={agentDialog.open}
        onOpenChange={(v) => setAgentDialog({ open: v, agent: v ? agentDialog.agent : undefined })}
        title={agentDialog.agent ? "Edit agent" : "New agent"}
        initial={agentDialog.agent}
        showAgency
        onSave={(data) => {
          upsertAgent({ id: agentDialog.agent?.id, name: data.name, email: data.email, agency: data.agency });
          refresh();
          setAgentDialog({ open: false });
        }}
      />

      {/* Share dialog */}
      {shareDialog.scenario && (
        <ShareWithAgentsDialog
          open={shareDialog.open}
          onOpenChange={(v) => setShareDialog({ open: v, scenario: v ? shareDialog.scenario : undefined })}
          scenarioName={shareDialog.scenario.name}
          initialAgentIds={shareDialog.scenario.sharedAgentIds || []}
          onSave={(ids) => {
            setScenarioMeta(shareDialog.scenario!.id, { sharedAgentIds: ids });
            refresh();
            toast.success(`Shared with ${ids.length} agent${ids.length === 1 ? "" : "s"}`);
          }}
        />
      )}
    </div>
  );
};

const ActionCard = ({ icon, title, desc, onClick, disabled }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group bg-card rounded-2xl border-2 border-border p-5 text-left transition-all flex items-center gap-4 ${
      disabled ? "opacity-50 cursor-not-allowed" : "hover:border-accent hover:shadow-lg hover:-translate-y-0.5"
    }`}
  >
    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground leading-tight mt-0.5">{desc}</p>
    </div>
    <ChevronRight size={16} className="text-muted-foreground group-hover:text-accent shrink-0" />
  </button>
);

interface PersonDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: { name: string; email: string; agency?: string };
  showAgency?: boolean;
  onSave: (data: { name: string; email: string; agency?: string }) => void;
}

const PersonDialog = ({ open, onOpenChange, title, initial, showAgency, onSave }: PersonDialogProps) => {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [agency, setAgency] = useState(initial?.agency || "");

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setEmail(initial?.email || "");
      setAgency(initial?.agency || "");
    }
  }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          {showAgency && (
            <div className="space-y-1.5">
              <Label>Agency (optional)</Label>
              <Input value={agency} onChange={(e) => setAgency(e.target.value)} placeholder="Agency name" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim() || !email.trim()}
            onClick={() => onSave({ name: name.trim(), email: email.trim(), agency: agency.trim() || undefined })}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdviserHome;
