import { useState } from "react";
import { Save, FolderOpen, Share2, Trash2, Download, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScenarioState, SavedScenario } from "@/lib/scenarioManager";
import { getSavedScenarios, saveScenario, updateScenario, deleteScenario, encodeStateToUrl } from "@/lib/scenarioManager";

interface ScenarioManagerProps {
  getCurrentState: () => ScenarioState;
  loadState: (state: ScenarioState) => void;
}

const ScenarioManager = ({ getCurrentState, loadState }: ScenarioManagerProps) => {
  const [open, setOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [scenarios, setScenarios] = useState<SavedScenario[]>(getSavedScenarios);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || null;

  const handleSave = () => {
    const name = saveName.trim() || `Scenario ${scenarios.length + 1}`;
    const state = getCurrentState();
    // Check if a scenario with the same name already exists
    const existing = scenarios.find((s) => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      const updated = updateScenario(existing.id, state);
      if (updated) {
        setScenarios(getSavedScenarios());
        setActiveScenarioId(existing.id);
        setSaveName("");
        toast.success(`Updated "${name}"`);
        return;
      }
    }
    const saved = saveScenario(name, state);
    setScenarios([...scenarios, saved]);
    setActiveScenarioId(saved.id);
    setSaveName("");
    toast.success(`Saved "${name}"`);
  };

  const handleUpdate = () => {
    if (!activeScenarioId) return;
    const state = getCurrentState();
    const updated = updateScenario(activeScenarioId, state);
    if (updated) {
      setScenarios(getSavedScenarios());
      toast.success(`Updated "${updated.name}"`);
    }
  };

  const handleLoad = (scenario: SavedScenario) => {
    loadState(scenario.state);
    setActiveScenarioId(scenario.id);
    setOpen(false);
    toast.success(`Loaded "${scenario.name}"`);
  };

  const handleDelete = (id: string) => {
    deleteScenario(id);
    setScenarios(scenarios.filter((s) => s.id !== id));
    if (activeScenarioId === id) setActiveScenarioId(null);
    toast("Scenario deleted");
  };

  const handleShare = () => {
    const state = getCurrentState();
    const url = encodeStateToUrl(state);
    setShareUrl(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) { setScenarios(getSavedScenarios()); setShareUrl(""); } }}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent/70 border border-accent/20 hover:bg-accent/10 hover:text-accent transition-all"
          aria-label="Scenarios"
        >
          <FolderOpen size={14} />
          Scenarios
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Save &amp; Load Scenarios</DialogTitle>
        </DialogHeader>

        {/* Save */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Save Current State</p>
          {activeScenario && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
              <span className="text-xs text-muted-foreground">Active:</span>
              <span className="text-sm font-medium text-foreground truncate flex-1">{activeScenario.name}</span>
              <Button size="sm" variant="outline" onClick={handleUpdate} className="gap-1 h-7 text-xs shrink-0">
                <RefreshCw size={12} /> Update
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder={activeScenario ? "New name or same to overwrite..." : "Scenario name..."}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Save size={14} /> Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Saving with an existing name will overwrite that scenario</p>
        </div>

        {/* Share */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground">Share as Link</p>
          {!shareUrl ? (
            <Button size="sm" variant="outline" onClick={handleShare} className="gap-1.5">
              <Share2 size={14} /> Generate Shareable Link
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1 text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 shrink-0">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Anyone with this link can view this scenario</p>
            </div>
          )}
        </div>

        {/* Load */}
        {scenarios.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-medium text-foreground">Saved Scenarios</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${s.id === activeScenarioId ? "bg-accent/5 border-accent/30" : "bg-muted/50 border-border"}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {s.name}
                      {s.id === activeScenarioId && <span className="text-[10px] text-accent font-normal">● active</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.savedAt).toLocaleDateString()} {new Date(s.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleLoad(s)} className="gap-1 h-7 text-xs">
                      <Download size={12} /> Load
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ScenarioManager;
