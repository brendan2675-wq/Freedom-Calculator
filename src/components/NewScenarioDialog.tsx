import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, User, Plus, ArrowLeft, PencilLine } from "lucide-react";
import { listClients, upsertClient, type Client } from "@/lib/clients";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (params: { client?: Client; scenarioName: string }) => void;
}

const NewScenarioDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [mode, setMode] = useState<"pick" | "new" | "unassigned">("pick");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [scenarioName, setScenarioName] = useState("");
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    if (open) {
      setClients(listClients());
      setMode("pick");
      setSearch("");
      setSelectedId(null);
      setNewName("");
      setScenarioName("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const selectedClient = clients.find((c) => c.id === selectedId);

  // Default scenario name when client picked / typed
  useEffect(() => {
    if (mode === "pick" && selectedClient && !scenarioName) {
      const parts = selectedClient.name.split(" ");
      const isCouple = selectedClient.name.toLowerCase().includes(" and ");
      const label = isCouple ? `The ${parts[parts.length - 1]}s' Plan` : `${parts[0]}'s Plan`;
      setScenarioName(label);
    }
    if (mode === "new" && newName && !scenarioName) {
      const parts = newName.split(" ");
      setScenarioName(`${parts[0]}'s Plan`);
    }
    if (mode === "unassigned" && !scenarioName) {
      setScenarioName("Working Scenario");
    }
  }, [mode, selectedClient, newName, scenarioName]);

  const canCreate =
    scenarioName.trim().length > 0 &&
    ((mode === "pick" && !!selectedClient) || (mode === "new" && newName.trim().length > 0) || mode === "unassigned");

  const handleCreate = () => {
    if (!canCreate) return;
    let client: Client | undefined;
    if (mode === "new") {
      client = upsertClient({ name: newName.trim(), email: "", agentIds: [] });
    } else if (mode === "pick") {
      client = selectedClient!;
    }
    onCreate({ client, scenarioName: scenarioName.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New scenario</DialogTitle>
        </DialogHeader>

        {mode === "pick" ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Client</Label>
              <div className="relative mt-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <div className="mt-2 max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border scrollbar-thin">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No clients match.</p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors ${
                        selectedId === c.id ? "bg-accent/10" : ""
                      }`}
                    >
                      <User size={14} className="text-accent shrink-0" />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => setMode("new")}
                className="mt-2 flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                <Plus size={12} /> New client
              </button>
              <button
                onClick={() => setMode("unassigned")}
                className="mt-2 flex w-full items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:bg-muted"
              >
                <PencilLine size={14} className="mt-0.5 shrink-0 text-accent" />
                <span>
                  <span className="block text-xs font-semibold text-foreground">Build without client</span>
                  <span className="block text-xs text-muted-foreground">Start a working scenario and assign it later.</span>
                </span>
              </button>
            </div>
          </div>
        ) : mode === "unassigned" ? (
          <div className="space-y-3">
            <button
              onClick={() => setMode("pick")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} /> Back to clients
            </button>
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground">
              Not ready to link this to a client? Build the strategy now and assign it later from Adviser Home.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => setMode("pick")}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={12} /> Back to existing clients
            </button>
            <div>
              <Label htmlFor="new-client-name" className="text-xs">Client name</Label>
              <Input
                id="new-client-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Dennis and Jane Nguyen"
                className="mt-1 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="scenario-name" className="text-xs">Scenario name</Label>
          <Input
            id="scenario-name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g. The Nguyens' Plan"
            className="mt-1 h-9 text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={!canCreate}>Create scenario</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewScenarioDialog;
