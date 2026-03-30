import type { AustralianState } from "@/lib/stampDuty";

export type InvestmentType = "house" | "townhouse" | "unit" | "commercial";

export interface LoanDetails {
  interestRate: number;
  interestOnlyPeriodYears: number;
  loanTermYears: number;
  lenderName: string;
  offsetBalance: number;
}

export interface RentalDetails {
  weeklyRent: number;
  vacancyRatePercent: number;
  propertyManagerFeePercent: number;
}

export interface PurchaseDetails {
  purchaseDate: string; // ISO date string
  purchasePrice: number;
  stampDuty: number;
  settlementDate: string; // ISO date string
}

export interface LoanSplit {
  id: string;
  label: string;
  amount: number;
}

export interface SaleCosts {
  // Acquisition costs
  stampDutyOnPurchase: number;
  legalFeesBuy: number;
  buyersAgentFees: number;
  buildingPestFees: number;
  mortgageEstablishmentFees: number;
  // Capital improvements
  renovations: number;
  structuralWork: number;
  // Ownership costs
  ownershipCostsTotal: number;
  // Selling costs
  agentCommission: number;
  legalFeesSell: number;
  advertisingCosts: number;
  stylingCosts: number;
  sellerAdvisoryFees: number;
  // CGT
  cgtDiscount: number; // 0.5 or 0
  incomeTaxRate: number; // e.g. 0.325
}

export const defaultSaleCosts: SaleCosts = {
  stampDutyOnPurchase: 0,
  legalFeesBuy: 0,
  buyersAgentFees: 0,
  buildingPestFees: 0,
  mortgageEstablishmentFees: 0,
  renovations: 0,
  structuralWork: 0,
  ownershipCostsTotal: 0,
  agentCommission: 0,
  legalFeesSell: 0,
  advertisingCosts: 0,
  stylingCosts: 0,
  sellerAdvisoryFees: 0,
  cgtDiscount: 0.5,
  incomeTaxRate: 0.45,
};

export interface ExistingProperty {
  id: string;
  nickname: string;
  estimatedValue: number;
  loanBalance: number;
  earmarked: boolean;
  sellInYears: number; // 0 = now, 1-10 = future years
  ownership: "trust" | "personal";
  trustName?: string;
  investmentType: InvestmentType;
  loan: LoanDetails;
  rental: RentalDetails;
  purchase: PurchaseDetails;
  loanSplits?: LoanSplit[];
  saleCosts?: SaleCosts;
  state?: AustralianState;
}

export interface FutureProperty {
  id: string;
  suburb: string;
  purchasePrice: number;
  rentalYield: number;
  projectedEquity5yr: number;
  lvr: number; // Loan-to-Value Ratio as percentage (e.g. 80)
  ownership: "trust" | "personal";
  trustName?: string;
  investmentType: InvestmentType;
  loan: LoanDetails;
  rental: RentalDetails;
  purchase: PurchaseDetails;
  saleCosts?: SaleCosts;
  proposedLoanAmount?: number;
  state?: AustralianState;
}

export const defaultLoanDetails: LoanDetails = {
  interestRate: 6.2,
  interestOnlyPeriodYears: 0,
  loanTermYears: 30,
  lenderName: "",
  offsetBalance: 0,
};

export const defaultRentalDetails: RentalDetails = {
  weeklyRent: 0,
  vacancyRatePercent: 2,
  propertyManagerFeePercent: 7,
};

export const defaultPurchaseDetails: PurchaseDetails = {
  purchaseDate: "",
  purchasePrice: 0,
  stampDuty: 0,
  settlementDate: "",
};
