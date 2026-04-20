import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { listAgents, type Agent } from "@/lib/clients";
import { Share2, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShareWithAgentsDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scenarioName: string;
  initialAgentIds: string[];
  onSave: (agentIds: string[]) => void;
}

const ShareWithAgentsDialog = ({ open, onOpenChange, scenarioName, initialAgentIds, onSave }: ShareWithAgentsDialogProps) => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selected, setSelected] = useState<string[]>(initialAgentIds);

  useEffect(() => {
    if (open) {
      setAgents(listAgents());
      setSelected(initialAgentIds);
    }
  }, [open, initialAgentIds]);

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={18} className="text-accent" /> Share scenario
          </DialogTitle>
          <DialogDescription>
            Grant read-only access to "{scenarioName}" for selected agents.
          </DialogDescription>
        </DialogHeader>
        {agents.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">No agents created yet.</p>
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); navigate("/adviser"); }}>
              <UserPlus size={14} className="mr-1.5" /> Manage agents
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {agents.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox checked={selected.includes(a.id)} onCheckedChange={() => toggle(a.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.email}{a.agency ? ` • ${a.agency}` : ""}</p>
                </div>
              </label>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(selected); onOpenChange(false); }}>Save sharing</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWithAgentsDialog;
