import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Home, Building2, Target } from "lucide-react";

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrimary: () => void;
}

const steps = [
  {
    icon: Home,
    title: "Add any properties you own",
    description:
      "Owner-occupied home, investments, or both. No properties yet? You can still plan ahead.",
  },
  {
    icon: Building2,
    title: "Plan your next purchases",
    description:
      "Add proposed buys with timing and price so we can model the impact on your portfolio.",
  },
  {
    icon: Target,
    title: "Set your payoff goal",
    description:
      "Choose a target date and watch your strategy pay your home off — at your own pace.",
  },
];

const WelcomeDialog = ({ open, onOpenChange, onPrimary }: WelcomeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Sparkles size={20} className="text-accent" />
            </div>
            <DialogTitle className="text-xl">Welcome to Atelier Wealth</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Build your property strategy in three steps — at your own pace.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-2 space-y-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li
                key={step.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <span className="w-6 h-6 rounded-full bg-foreground text-background text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <DialogFooter className="mt-4 sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Skip for now
          </Button>
          <Button onClick={onPrimary} className="min-w-[140px]">
            Get started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeDialog;
