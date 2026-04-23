export type CashflowDocumentCategory =
  | "council"
  | "insurance"
  | "land-tax"
  | "water"
  | "repairs"
  | "body-corporate"
  | "legal"
  | "pest"
  | "cleaning"
  | "gardening"
  | "sundry";

export type CashflowDocumentFrequency = "annual" | "quarterly" | "monthly";

export type ExtractedCashflowItemStatus = "needs-review" | "ready" | "failed";

export type ExtractedCashflowItem = {
  id: string;
  fileName: string;
  supplier?: string;
  monthIndex?: number;
  amount?: number;
  category: CashflowDocumentCategory;
  confidence?: number;
  recurring?: {
    isRecurring: boolean;
    frequency?: CashflowDocumentFrequency;
  };
  status: ExtractedCashflowItemStatus;
  note?: string;
};

const supportedExtensions = ["pdf", "jpg", "jpeg", "png", "webp", "csv", "xls", "xlsx"];

export const isSupportedCashflowDocument = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return Boolean(extension && supportedExtensions.includes(extension));
};

export const createCashflowDocumentPlaceholders = (files: File[]): ExtractedCashflowItem[] => files.map((file) => {
  const supported = isSupportedCashflowDocument(file.name);
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    category: "sundry",
    recurring: { isRecurring: false },
    status: supported ? "needs-review" : "failed",
    note: supported ? "Complete the details before applying." : "Unsupported file type.",
  };
});

export const cashflowDocumentCategories: Array<{ value: CashflowDocumentCategory; label: string }> = [
  { value: "council", label: "Council rates" },
  { value: "insurance", label: "Insurance" },
  { value: "land-tax", label: "Land tax" },
  { value: "water", label: "Water charges" },
  { value: "repairs", label: "Repairs and maintenance" },
  { value: "body-corporate", label: "Body corporate fees" },
  { value: "legal", label: "Legal fees" },
  { value: "pest", label: "Pest control" },
  { value: "cleaning", label: "Cleaning" },
  { value: "gardening", label: "Gardening / lawn mowing" },
  { value: "sundry", label: "Sundry expenses" },
];