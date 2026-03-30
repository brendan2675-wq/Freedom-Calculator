import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { InvestmentTypeIcon } from "@/components/InvestmentTypeIcon";
import PropertyDetailSheet from "@/components/PropertyDetailSheet";
import type { ExistingProperty, SaleCosts } from "@/types/property";
import { defaultSaleCosts } from "@/types/property";
import { calculateStampDuty } from "@/lib/stampDuty";
import { format } from "date-fns";

interface Props {
  properties: ExistingProperty[];
  onUpdate: (updated: ExistingProperty) => void;
  growthRate: number;
}

const SoldProperties = ({ properties, onUpdate, growthRate }: Props) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedProperty = properties.find((p) => p.id === selectedId) || null;

  return (
    <section>
      <div className="gold-underline pb-2 mb-1">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
          <PackageCheck size={26} strokeWidth={2.25} className="text-accent" />
          Sold Properties
          {properties.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </span>
          )}
        </h2>
      </div>

      {properties.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border/60 bg-card/30 p-8 flex flex-col items-center justify-center text-center">
          <PackageCheck size={32} className="text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No properties sold yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Earmark a property and set a past settlement date to move it here</p>
        </div>
      ) : (
      <div className="grid grid-cols-4 gap-3 mt-3">
        {properties.map((p) => {
          const sc = p.saleCosts || { ...defaultSaleCosts };
          const purchasePrice = p.purchase.purchasePrice || 0;
          const autoStampDuty = p.state && purchasePrice > 0
            ? calculateStampDuty(purchasePrice, p.state, p.purchase.purchaseDate || undefined)
            : 0;
          const stampDutyAcq = sc.stampDutyOnPurchase || autoStampDuty;
          const totalAcquisition = purchasePrice + stampDutyAcq + sc.legalFeesBuy + sc.buyersAgentFees + sc.buildingPestFees + sc.mortgageEstablishmentFees;
          const totalImprovements = sc.renovations + sc.structuralWork;
          const totalOwnership = sc.ownershipCostsTotal;
          const totalSelling = sc.agentCommission + sc.legalFeesSell + sc.advertisingCosts + sc.stylingCosts + sc.sellerAdvisoryFees;
          const costBase = totalAcquisition + totalImprovements + totalOwnership + totalSelling;

          const saleProceeds = p.estimatedValue - p.loanBalance - totalSelling;
          const capitalGainLoss = purchasePrice > 0 ? p.estimatedValue - costBase : 0;

          const settlementDate = p.purchase.settlementDate
            ? format(new Date(p.purchase.settlementDate), "dd MMM yyyy")
            : "—";

          // Calculate hold time
          let holdTime = "—";
          if (p.purchase.purchaseDate && p.purchase.settlementDate) {
            const start = new Date(p.purchase.purchaseDate);
            const end = new Date(p.purchase.settlementDate);
            const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
            const years = Math.floor(totalMonths / 12);
            const months = totalMonths % 12;
            holdTime = years > 0 ? `${years}yr ${months}mo` : `${months}mo`;
          }

          return (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="bg-card/60 rounded-xl p-4 border border-border/50 shadow-sm cursor-pointer hover:shadow-md transition-all opacity-60 hover:opacity-80"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <InvestmentTypeIcon type={p.investmentType} size={16} className="text-muted-foreground" />
                </div>
                <p className="font-semibold text-sm text-foreground truncate">{p.nickname || "Untitled"}</p>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                <div>
                  <label className="text-muted-foreground text-[11px]">Sale Proceeds</label>
                  <p className={`font-medium ${saleProceeds >= 0 ? "text-accent" : "text-destructive"}`}>
                    ${saleProceeds.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px]">Hold Time</label>
                  <p className="text-foreground font-medium">{holdTime}</p>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px]">Capital Gain/Loss</label>
                  <p className={`font-medium ${capitalGainLoss >= 0 ? "text-accent" : "text-destructive"}`}>
                    {capitalGainLoss >= 0 ? "+" : ""}${capitalGainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-muted-foreground text-[11px]">Settlement Date</label>
                  <p className="text-foreground font-medium text-xs">{settlementDate}</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-1.5">
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {p.ownership === "trust" ? (p.trustName || "Trust") : "Personal"}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  Settled
                </span>
              </div>
            </div>
          );
        })}
      </div>
      )}

      <PropertyDetailSheet
        property={selectedProperty}
        open={!!selectedProperty}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        onUpdate={(updated) => onUpdate(updated as ExistingProperty)}
        variant="existing"
        growthRate={growthRate}
      />
    </section>
  );
};

export default SoldProperties;
