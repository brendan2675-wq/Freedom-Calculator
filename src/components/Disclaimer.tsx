import { AlertTriangle } from "lucide-react";

interface Props {
  accepted: boolean;
  setAccepted: (v: boolean) => void;
}

const Disclaimer = ({ accepted, setAccepted }: Props) => {
  return (
    <section className="bg-card rounded-xl shadow-md p-6 md:p-8 border border-border">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <AlertTriangle size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Important Disclaimer</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            These projections are estimates only and do not constitute financial advice. Property values and growth rates are assumptions only. 
            Please consult a qualified financial adviser before making any investment decisions.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 rounded border-border accent-accent"
            />
            <span className="text-foreground text-sm font-medium">I understand these are projections only</span>
          </label>
        </div>
      </div>
    </section>
  );
};

export default Disclaimer;
