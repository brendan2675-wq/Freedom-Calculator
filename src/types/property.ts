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

export interface ExistingProperty {
  id: string;
  nickname: string;
  estimatedValue: number;
  loanBalance: number;
  earmarked: boolean;
  ownership: "trust" | "personal";
  loan: LoanDetails;
  rental: RentalDetails;
  purchase: PurchaseDetails;
}

export interface FutureProperty {
  id: string;
  suburb: string;
  purchasePrice: number;
  rentalYield: number;
  projectedEquity5yr: number;
  ownership: "trust" | "personal";
  loan: LoanDetails;
  rental: RentalDetails;
  purchase: PurchaseDetails;
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
