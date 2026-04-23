import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { toast } from "sonner";
import CashflowTracker from "@/pages/CashflowTracker";
import { saveCashflowForProperty } from "@/lib/cashflowManager";
import type { ExistingProperty } from "@/types/property";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
  },
}));

const renderTracker = () => render(<BrowserRouter><CashflowTracker /></BrowserRouter>);

const file = (name: string, type: string) => new File(["sample bill content"], name, { type });
const propertyFixture = (id: string, nickname: string, weeklyRent: number): ExistingProperty => ({
  id,
  nickname,
  address: `${nickname} Street`,
  estimatedValue: 650000,
  loanBalance: 420000,
  earmarked: false,
  sellInYears: 0,
  ownership: "personal",
  investmentType: "house",
  loan: { interestRate: 6.2, interestOnlyPeriodYears: 0, loanTermYears: 30, lenderName: "", offsetBalance: 0 },
  rental: { weeklyRent, vacancyRatePercent: 0, propertyManagerFeePercent: 0 },
  purchase: { purchaseDate: "", purchasePrice: 0, stampDuty: 0, settlementDate: "" },
});

const getReviewRow = (fileName: string) => {
  const reviewFileName = screen.getAllByText(fileName).find((element) => element.tagName.toLowerCase() === "p");
  return reviewFileName?.closest("div.grid") as HTMLElement;
};

const completeReviewRow = (fileName: string, { monthIndex, category, amount, recurring = false, frequency = "monthly" }: { monthIndex: number; category: string; amount: number; recurring?: boolean; frequency?: string }) => {
  const row = getReviewRow(fileName);
  const selects = row.querySelectorAll("select");
  const inputs = row.querySelectorAll("input");

  fireEvent.change(selects[0], { target: { value: String(monthIndex) } });
  fireEvent.change(selects[1], { target: { value: category } });
  fireEvent.change(inputs[1], { target: { value: String(amount) } });

  if (recurring) {
    fireEvent.click(inputs[2]);
    fireEvent.change(selects[2], { target: { value: frequency } });
  }
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("FY Docs upload workflow", () => {
  it("opens a source picker from Upload docs with device, phone and cloud choices", () => {
    renderTracker();

    fireEvent.click(screen.getByRole("button", { name: /upload docs/i }));

    expect(screen.getByText("Choose document source")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /computer or device/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /phone camera or files/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /google drive/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /onedrive/i })).toBeInTheDocument();
  });

  it("queues relevant utility bills and receipts for manual review without retaining document files", () => {
    const { container } = renderTracker();
    const uploadInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      file("council-rates-fy2027.pdf", "application/pdf"),
      file("water-bill-fy2027.pdf", "application/pdf"),
      file("landlord-insurance-fy2027.pdf", "application/pdf"),
      file("bunnings-repair-receipt-fy2027.jpg", "image/jpeg"),
      file("notes.txt", "text/plain"),
    ];

    fireEvent.change(uploadInput, { target: { files } });

    expect(screen.getByText("Review FY documents")).toBeInTheDocument();
    expect(screen.getAllByText("council-rates-fy2027.pdf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("water-bill-fy2027.pdf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("landlord-insurance-fy2027.pdf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bunnings-repair-receipt-fy2027.jpg").length).toBeGreaterThan(0);
    expect(screen.getAllByText("notes.txt").length).toBeGreaterThan(0);
    expect(screen.getByText("Unsupported file type.")).toBeInTheDocument();
    expect(localStorage.getItem("cashflow-working-state") || "").not.toContain("council-rates-fy2027.pdf");
  });

  it("applies reviewed recurring utilities to Utilities & Charges and one-off receipts to the worksheet", () => {
    const { container } = renderTracker();
    const uploadInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(uploadInput, { target: { files: [
      file("council-rates-fy2027.pdf", "application/pdf"),
      file("water-bill-fy2027.pdf", "application/pdf"),
      file("bunnings-repair-receipt-fy2027.jpg", "image/jpeg"),
    ] } });

    completeReviewRow("council-rates-fy2027.pdf", { monthIndex: 0, category: "council", amount: 420, recurring: true, frequency: "quarterly" });
    completeReviewRow("water-bill-fy2027.pdf", { monthIndex: 2, category: "water", amount: 180, recurring: true, frequency: "quarterly" });
    completeReviewRow("bunnings-repair-receipt-fy2027.jpg", { monthIndex: 1, category: "repairs", amount: 275 });

    fireEvent.click(screen.getByRole("button", { name: /apply 3 to cashflow/i }));

    expect(screen.getAllByDisplayValue("420").length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByDisplayValue("180").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByDisplayValue("275")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("3 document items applied to cashflow");
  });

  it("adds multiple reviewed receipts into the same row and month", () => {
    const { container } = renderTracker();
    const uploadInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(uploadInput, { target: { files: [
      file("plumber-repair-receipt-aug-2026.pdf", "application/pdf"),
      file("electrician-repair-receipt-aug-2026.pdf", "application/pdf"),
    ] } });

    completeReviewRow("plumber-repair-receipt-aug-2026.pdf", { monthIndex: 1, category: "repairs", amount: 200 });
    completeReviewRow("electrician-repair-receipt-aug-2026.pdf", { monthIndex: 1, category: "repairs", amount: 75 });

    fireEvent.click(screen.getByRole("button", { name: /apply 2 to cashflow/i }));

    const repairsRow = screen.getByDisplayValue("Repairs and maintenance").closest("tr") as HTMLElement;
    expect(within(repairsRow).getByDisplayValue("275")).toBeInTheDocument();
  });

  it("shows placeholder feedback for Google Drive and OneDrive imports", () => {
    renderTracker();

    fireEvent.click(screen.getByRole("button", { name: /upload docs/i }));
    fireEvent.click(screen.getByRole("button", { name: /google drive/i }));
    fireEvent.click(screen.getByRole("button", { name: /upload docs/i }));
    fireEvent.click(screen.getByRole("button", { name: /onedrive/i }));

    expect(toast.info).toHaveBeenCalledWith("Google Drive import will be connected with the backend cloud auth work.");
    expect(toast.info).toHaveBeenCalledWith("OneDrive import will be connected with the backend cloud auth work.");
  });
});

describe("Cashflow overall view", () => {
  it("switches to an annual overall view using saved worksheets without monthly cashflow or cashflow yield", () => {
    localStorage.setItem("portfolio-properties", JSON.stringify([
      propertyFixture("property-1", "Brisbane Unit", 600),
      propertyFixture("property-2", "Perth House", 700),
    ]));
    saveCashflowForProperty({ scenarioId: "current-cashflow-plan", propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" }, {
      rows: [
        { id: "rental-income", label: "Rental income", type: "income", values: Array(12).fill(2600) },
        { id: "interest", label: "Interest", type: "expense", values: Array(12).fill(3200) },
      ],
    });

    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /overall view/i }));

    expect(screen.getByText("Overall cashflow")).toBeInTheDocument();
    expect(screen.getByText("Brisbane Unit")).toBeInTheDocument();
    expect(screen.getByText("Perth House")).toBeInTheDocument();
    expect(screen.getByText("No worksheet yet")).toBeInTheDocument();
    expect(screen.getByText("-$7,200")).toBeInTheDocument();
    expect(screen.queryByText(/monthly cashflow worksheet/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/cashflow yield/i)).not.toBeInTheDocument();
  });

  it("updates negative gearing estimate when partner income is included", () => {
    localStorage.setItem("portfolio-properties", JSON.stringify([propertyFixture("property-1", "Brisbane Unit", 600)]));
    saveCashflowForProperty({ scenarioId: "current-cashflow-plan", propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" }, {
      rows: [
        { id: "rental-income", label: "Rental income", type: "income", values: Array(12).fill(2500) },
        { id: "interest", label: "Interest", type: "expense", values: Array(12).fill(3500) },
      ],
    });

    renderTracker();
    fireEvent.click(screen.getByRole("button", { name: /overall view/i }));
    fireEvent.change(screen.getByLabelText(/your taxable income/i).querySelector("input") as HTMLInputElement, { target: { value: "180000" } });
    fireEvent.click(screen.getByLabelText(/include partner/i));
    fireEvent.change(screen.getByLabelText(/partner taxable income/i).querySelector("input") as HTMLInputElement, { target: { value: "120000" } });

    expect(screen.getAllByText("$4,140").length).toBeGreaterThan(0);
  });
});