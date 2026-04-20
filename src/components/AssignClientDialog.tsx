import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { listClients, listAgents, type Client, type Agent } from "@/lib/clients";
import { UserCheck } from "lucide-react";

interface AssignClientDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scenarioName: string;
  initialClientId?: string;
  initialAgentIds?: string[];
  initialType?: "individual" | "smsf";
  onAssign: (data: { clientId?: string; agentIds: string[]; type: "individual" | "smsf" }) => void;
}

const AssignClientDialog = ({
  open, onOpenChange, scenarioName, initialClientId, initialAgentIds = [], initialType = "individual", onAssign,
}: AssignClientDialogProps) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [clientId, setClientId] = useState<string>(initialClientId || "");
  const [agentIds, setAgentIds] = useState<string[]>(initialAgentIds);
  const [type, setType] = useState<"individual" | "smsf">(initialType);

  useEffect(() => {
    if (open) {
      setClients(listClients());
      setAgents(listAgents());
      setClientId(initialClientId || "");
      setAgentIds(initialAgentIds);
      setType(initialType);
    }
  }, [open, initialClientId, initialAgentIds, initialType]);

  const toggleAgent = (id: string) => {
    setAgentIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck size={18} className="text-accent" /> Assign scenario
          </DialogTitle>
          <DialogDescription>"{scenarioName}" — pick a client and (optionally) share with agents.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType("individual")}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${type === "individual" ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border text-muted-foreground"}`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setType("smsf")}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${type === "smsf" ? "bg-accent text-accent-foreground border-accent" : "bg-background border-border text-muted-foreground"}`}
              >
                SMSF
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            {clients.length === 0 ? (
              <p className="text-xs text-muted-foreground">No clients yet — create one from the Adviser dashboard.</p>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— Unassigned —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                ))}
              </select>
            )}
          </div>

          {agents.length > 0 && (
            <div className="space-y-2">
              <Label>Share with agents (read-only)</Label>
              <div className="space-y-1 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {agents.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer">
                    <Checkbox checked={agentIds.includes(a.id)} onCheckedChange={() => toggleAgent(a.id)} />
                    <span className="text-sm">{a.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{a.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onAssign({ clientId: clientId || undefined, agentIds, type }); onOpenChange(false); }}>
            Save assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignClientDialog;
