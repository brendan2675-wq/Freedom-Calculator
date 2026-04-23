import { useEffect, useMemo, useRef, useState } from "react";
import { Banknote, CalendarDays, Copy, Download, FileText, Home, Info as InfoIcon, LayoutDashboard, Percent, Plus, Save, Trash2, TrendingDown, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ScenarioContextBanner from "@/components/ScenarioContextBanner";
import UserMenu from "@/components/UserMenu";
import FyDocsReviewDialog from "@/components/FyDocsReviewDialog";
import FyDocsUploadSourceDialog from "@/components/FyDocsUploadSourceDialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import AddressSearchInput from "@/components/AddressSearchInput";
import OwnershipToggle from "@/components/OwnershipToggle";
import { InvestmentTypeIcon, getInvestmentTypeLabel, investmentTypes } from "@/components/InvestmentTypeIcon";
import type { ExistingProperty, InvestmentType, LoanSplit } from "@/types/property";
import { defaultLoanDetails, defaultPurchaseDetails, defaultRentalDetails } from "@/types/property";
import { getRole } from "@/lib/auth";
import { getActiveScenario, getScenario } from "@/lib/scenarioManager";
import { estimateNegativeGearingBenefit, getActiveCashflowContext, getAnnualCashflowSummary, getCashflowForProperty, saveCashflowForProperty, setActiveCashflowContext, type CashflowAnnualSummary, type CashflowPropertyType, type CashflowTaxSettings } from "@/lib/cashflowManager";
import { createCashflowDocumentPlaceholders, type CashflowDocumentFrequency, type ExtractedCashflowItem } from "@/lib/documentExtraction";

const createFinancialYearMonths = (endYear: number) => {
  const priorYear = String(endYear - 1).slice(-2);
  const currentYear = String(endYear).slice(-2);
  return [`Jul-${priorYear}`, `Aug-${priorYear}`, `Sep-${priorYear}`, `Oct-${priorYear}`, `Nov-${priorYear}`, `Dec-${priorYear}`, `Jan-${currentYear}`, `Feb-${currentYear}`, `Mar-${currentYear}`, `Apr-${currentYear}`, `May-${currentYear}`, `Jun-${currentYear}`];
};
const months = createFinancialYearMonths(2027);
const financialPeriods = [
  { financialYear: "FY2028", label: "FY 2028", months: createFinancialYearMonths(2028) },
  { financialYear: "FY2027", label: "FY 2027", months },
  { financialYear: "FY2026", label: "FY 2026", months: createFinancialYearMonths(2026) },
];
const getFinancialYearNumber = (financialYear: string) => Number(financialYear.replace(/\D/g, "")) || 2027;
const getFinancialPeriod = (endYear: number) => ({ financialYear: `FY${endYear}`, label: `FY ${endYear}`, months: createFinancialYearMonths(endYear) });

const CASHFLOW_TEMPLATE_VERSION = 2;
const INITIAL_WEEKLY_RENT = 0;
const INITIAL_LOAN_AMOUNT = 0;
const INITIAL_INTEREST_RATE = 0;

type CashflowRow = {
  id: string;
  label: string;
  type: "income" | "expense";
  values: number[];
  weeklyRent?: number;
};

const monthlyRentFromWeekly = (weeklyRent: number) => Math.round((weeklyRent * 52) / 12);
const monthlyInterestOnlyCost = (loanAmount: number, interestRate: number) => Math.round((loanAmount * (interestRate / 100)) / 12);
const monthlyAgentFee = (weeklyRent: number) => Math.round(monthlyRentFromWeekly(weeklyRent) * 0.06);
const getLoanBalance = (item: ExistingProperty) => item.loanSplits?.length ? item.loanSplits.reduce((sum, split) => sum + (split.amount || 0), 0) : item.loanBalance || 0;
const scheduledExpenseValues = (amount: number, frequency: "annual" | "quarterly" | "monthly") => {
  if (frequency === "annual") return months.map((_, index) => index === 11 ? amount : 0);
  if (frequency === "quarterly") return months.map((_, index) => index % 3 === 0 ? amount : 0);
  return Array(12).fill(amount);
};

const initialRows: CashflowRow[] = [
  { id: "rental-income", label: "Rental income", type: "income", weeklyRent: INITIAL_WEEKLY_RENT, values: Array(12).fill(monthlyRentFromWeekly(INITIAL_WEEKLY_RENT)) },
  { id: "advertising", label: "Advertising for tenants", type: "expense", values: Array(12).fill(0) },
  { id: "bank-fees", label: "Bank fees", type: "expense", values: Array(12).fill(0) },
  { id: "body-corporate", label: "Body corporate fees", type: "expense", values: Array(12).fill(0) },
  { id: "borrowing", label: "Borrowing expenses", type: "expense", values: Array(12).fill(0) },
  { id: "cleaning", label: "Cleaning", type: "expense", values: Array(12).fill(0) },
  { id: "council", label: "Council rates", type: "expense", values: Array(12).fill(0) },
  { id: "depreciation", label: "Depreciation on plant", type: "expense", values: Array(12).fill(0) },
  { id: "gardening", label: "Gardening / lawn mowing", type: "expense", values: Array(12).fill(0) },
  { id: "insurance", label: "Insurance", type: "expense", values: Array(12).fill(0) },
  { id: "interest", label: "Interest on loan", type: "expense", values: Array(12).fill(monthlyInterestOnlyCost(INITIAL_LOAN_AMOUNT, INITIAL_INTEREST_RATE)) },
  { id: "land-tax", label: "Land tax", type: "expense", values: Array(12).fill(0) },
  { id: "legal", label: "Legal fees", type: "expense", values: Array(12).fill(0) },
  { id: "pest", label: "Pest control", type: "expense", values: Array(12).fill(0) },
  { id: "agent-fees", label: "Property agent fees / commission", type: "expense", values: Array(12).fill(monthlyAgentFee(INITIAL_WEEKLY_RENT)) },
  { id: "repairs", label: "Repairs and maintenance", type: "expense", values: Array(12).fill(0) },
  { id: "capital-works", label: "Capital works deductions", type: "expense", values: Array(12).fill(0) },
  { id: "stationery", label: "Stationary telephone and postage", type: "expense", values: Array(12).fill(0) },
  { id: "travel", label: "Travel expenses", type: "expense", values: Array(12).fill(0) },
  { id: "water", label: "Water charges", type: "expense", values: Array(12).fill(0) },
  { id: "sundry", label: "Sundry expenses", type: "expense", values: Array(12).fill(0) },
];

const property = {
  owner: "",
  nickname: "",
  address: "",
  bank: "",
  weeklyRent: INITIAL_WEEKLY_RENT,
  interestRate: INITIAL_INTEREST_RATE,
  loanAmount: INITIAL_LOAN_AMOUNT,
  loanSplits: [] as LoanSplit[],
  manager: "",
  investmentType: "house" as InvestmentType,
  ownership: "personal" as "trust" | "personal",
  trustName: "",
};

type CouncilRatesState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type InsuranceState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type LandTaxState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type WaterState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type CashflowState = { rows: CashflowRow[]; propertyDetails: typeof property; councilRates: CouncilRatesState; insurance: InsuranceState; landTax: LandTaxState; water: WaterState; activeMonth: number; templateVersion: number };
type SavedCashflowScenario = { id: string; name: string; savedAt: string; state: CashflowState };
type CashflowPropertyDetails = typeof property;
type PortfolioPropertyOption = { id: string; label: string; address: string; owner: string; bank: string; weeklyRent: number; interestRate: number; loanAmount: number; estimatedValue: number; loanSplits: LoanSplit[]; propertyType: CashflowPropertyType; investmentType: InvestmentType; ownership: "trust" | "personal"; trustName?: string };
type CashflowViewMode = "detail" | "overall";
type CashflowOverviewRow = PortfolioPropertyOption & CashflowAnnualSummary & { hasWorksheet: boolean; estimatedTaxBenefit: number; afterTaxCashflow: number; rentalYield: number; taxOwnership: "personal" | "trust" | "smsf" };
type FinancialPeriodOption = { financialYear: string; label: string; months: string[] };

const CASHFLOW_SCENARIOS_KEY = "saved-cashflow-scenarios";
const ACTIVE_CASHFLOW_SCENARIO_KEY = "active-cashflow-scenario-id";
const CASHFLOW_WORKING_STATE_KEY = "cashflow-working-state";
const CASHFLOW_VIEW_KEY = "cashflow-view-mode";
const CASHFLOW_TAX_SETTINGS_KEY = "cashflow-tax-settings";
const CURRENT_CASHFLOW_PLAN_ID = "current-cashflow-plan";
const defaultCouncilRates: CouncilRatesState = { amount: 0, frequency: "annual" };
const defaultInsurance: InsuranceState = { amount: 0, frequency: "monthly" };
const defaultLandTax: LandTaxState = { amount: 0, frequency: "annual" };
const defaultWater: WaterState = { amount: 0, frequency: "annual" };

const getSavedCashflowScenarios = (): SavedCashflowScenario[] => {
  try {
    const stored = localStorage.getItem(CASHFLOW_SCENARIOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const getLinkedProperty = (propertyId?: string | null): ExistingProperty | null => {
  if (!propertyId) return null;
  try {
    if (propertyId === "ppor") {
      const stored = localStorage.getItem("portfolio-ppor");
      return stored ? JSON.parse(stored) as ExistingProperty : null;
    }
    const properties = JSON.parse(localStorage.getItem("portfolio-properties") || "[]") as ExistingProperty[];
    return properties.find((item) => item.id === propertyId) || null;
  } catch {
    return null;
  }
};

const getLinkedLoanBalance = (item?: ExistingProperty | null) => item ? getLoanBalance(item) : 0;
const getLinkedInterestRate = (item?: ExistingProperty | null) => item?.loanSplits?.find((split) => split.interestRate !== undefined)?.interestRate ?? item?.loan?.interestRate ?? 0;

const syncPropertyDetailsFromLinkedProperty = (current: CashflowPropertyDetails, item?: ExistingProperty | null): CashflowPropertyDetails => {
  if (!item) return current;
  const interestRate = getLinkedInterestRate(item);
  return {
    ...current,
    nickname: item.nickname || "Portfolio property",
    address: item.address || "",
    owner: item.ownership === "trust" ? item.trustName || "Trust" : "Personal",
    bank: item.loan?.lenderName || "",
    weeklyRent: item.rental?.weeklyRent || 0,
    interestRate,
    loanAmount: getLinkedLoanBalance(item),
    loanSplits: item.loanSplits || [],
    investmentType: item.investmentType || "house",
    ownership: item.ownership,
    trustName: item.trustName || "",
  };
};

const getPortfolioPropertyOptions = (): PortfolioPropertyOption[] => {
  try {
    const storedPpor = localStorage.getItem("portfolio-ppor");
    const storedProperties = localStorage.getItem("portfolio-properties");
    const ppor = storedPpor ? JSON.parse(storedPpor) as ExistingProperty : null;
    const properties = storedProperties ? JSON.parse(storedProperties) as ExistingProperty[] : [];
    return [ppor, ...properties].filter((item): item is ExistingProperty => Boolean(item)).map((item) => ({
      id: item.id,
      label: item.nickname || "Portfolio property",
      address: item.address || "",
      owner: item.ownership === "trust" ? item.trustName || "Trust" : "Personal",
      bank: item.loan?.lenderName || "",
      weeklyRent: item.rental?.weeklyRent || 0,
      interestRate: getLinkedInterestRate(item),
      loanAmount: getLoanBalance(item),
      estimatedValue: item.estimatedValue || 0,
      loanSplits: item.loanSplits || [],
      propertyType: item.id === "ppor" ? "ppor" : item.ownership === "trust" ? "smsf" : "investment",
      investmentType: item.investmentType || "house",
      ownership: item.ownership,
      trustName: item.trustName || "",
    }));
  } catch {
    return [];
  }
};

const defaultCashflowState: CashflowState = { rows: initialRows, propertyDetails: property, councilRates: defaultCouncilRates, insurance: defaultInsurance, landTax: defaultLandTax, water: defaultWater, activeMonth: 7, templateVersion: CASHFLOW_TEMPLATE_VERSION };

const normalizeCashflowState = (state?: Partial<CashflowState>): CashflowState => {
  const councilRates = { ...defaultCouncilRates, ...state?.councilRates };
  const insurance = { ...defaultInsurance, ...state?.insurance };
  const landTax = { ...defaultLandTax, ...state?.landTax };
  const water = { ...defaultWater, ...state?.water };
  const rows = (state?.rows?.length ? state.rows : initialRows).map((row) => {
    if (row.id === "council") return { ...row, values: scheduledExpenseValues(councilRates.amount, councilRates.frequency) };
    if (row.id === "insurance") return { ...row, values: scheduledExpenseValues(insurance.amount, insurance.frequency) };
    if (row.id === "land-tax") return { ...row, values: scheduledExpenseValues(landTax.amount, landTax.frequency) };
    if (row.id === "water") return { ...row, values: scheduledExpenseValues(water.amount, water.frequency) };
    return row;
  });

  return {
    ...defaultCashflowState,
    ...state,
    propertyDetails: { ...property, ...state?.propertyDetails },
    councilRates,
    insurance,
    landTax,
    water,
    rows,
  };
};

const getInitialCashflowState = (): CashflowState => {
  try {
    const context = getActiveCashflowContext();
    const activeScenarioId = localStorage.getItem("active-scenario-id");
    if (context && activeScenarioId && context.scenarioId !== activeScenarioId) return defaultCashflowState;
    const linked = context ? getCashflowForProperty<CashflowState>(context) : undefined;
    if (linked?.state) return normalizeCashflowState(linked.state);
    const activeScenario = getSavedCashflowScenarios().find((scenario) => scenario.id === localStorage.getItem(ACTIVE_CASHFLOW_SCENARIO_KEY));
    const workingState = localStorage.getItem(CASHFLOW_WORKING_STATE_KEY);
    const parsedWorkingState = workingState ? JSON.parse(workingState) : undefined;
    return normalizeCashflowState(activeScenario?.state ?? (parsedWorkingState?.templateVersion === CASHFLOW_TEMPLATE_VERSION ? parsedWorkingState : undefined));
  } catch {
    return defaultCashflowState;
  }
};

const getInitialCashflowView = (): CashflowViewMode => localStorage.getItem(CASHFLOW_VIEW_KEY) === "overall" ? "overall" : "detail";
const getInitialTaxSettings = (): CashflowTaxSettings => {
  try {
    return { primaryIncome: 0, partnerIncome: 0, includePartner: false, includeMedicare: true, ...(JSON.parse(localStorage.getItem(CASHFLOW_TAX_SETTINGS_KEY) || "{}") as Partial<CashflowTaxSettings>) };
  } catch {
    return { primaryIncome: 0, partnerIncome: 0, includePartner: false, includeMedicare: true };
  }
};

const formatCurrency = (value: number) => value === 0 ? "$0" : value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;
const parseCurrencyValue = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
const formatInterestRate = (value: number) => `${value.toFixed(2)}%`;
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const CashflowTracker = () => {
  const navigate = useNavigate();
  const [activeMonth, setActiveMonth] = useState(() => getInitialCashflowState().activeMonth);
  const [rows, setRows] = useState<CashflowRow[]>(() => getInitialCashflowState().rows);
  const [propertyDetails, setPropertyDetails] = useState(() => getInitialCashflowState().propertyDetails);
  const [councilRates, setCouncilRates] = useState<CouncilRatesState>(() => getInitialCashflowState().councilRates);
  const [insurance, setInsurance] = useState<InsuranceState>(() => getInitialCashflowState().insurance);
  const [landTax, setLandTax] = useState<LandTaxState>(() => getInitialCashflowState().landTax);
  const [water, setWater] = useState<WaterState>(() => getInitialCashflowState().water);
  const [saveName, setSaveName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedCashflowScenario[]>(getSavedCashflowScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(() => localStorage.getItem(ACTIVE_CASHFLOW_SCENARIO_KEY));
  const [portfolioProperties, setPortfolioProperties] = useState<PortfolioPropertyOption[]>(getPortfolioPropertyOptions);
  const [cashflowContext, setCashflowContextState] = useState(() => getActiveCashflowContext());
  const [financialYear, setFinancialYear] = useState(() => getActiveCashflowContext()?.financialYear || "FY2027");
  const [cashflowView, setCashflowView] = useState<CashflowViewMode>(getInitialCashflowView);
  const [taxSettings, setTaxSettings] = useState<CashflowTaxSettings>(getInitialTaxSettings);
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [propertySheetOpen, setPropertySheetOpen] = useState(false);
  const [propertySheetMode, setPropertySheetMode] = useState<"current" | "new">("current");
  const [fyDocItems, setFyDocItems] = useState<ExtractedCashflowItem[]>([]);
  const [fyDocsReviewOpen, setFyDocsReviewOpen] = useState(false);
  const [fyDocsSourceOpen, setFyDocsSourceOpen] = useState(false);
  const deviceUploadRef = useRef<HTMLInputElement>(null);
  const phoneUploadRef = useRef<HTMLInputElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const syncingScrollRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextAutosaveRef = useRef(true);
  const [highlightFirstSplit, setHighlightFirstSplit] = useState(false);
  const firstSplitAmountRef = useRef<HTMLInputElement>(null);
  const activeScenario = savedScenarios.find((scenario) => scenario.id === activeScenarioId);
  const linkedRecord = cashflowContext ? getCashflowForProperty<CashflowState>(cashflowContext) : undefined;
  const linkedScenario = cashflowContext ? getScenario(cashflowContext.scenarioId) || getActiveScenario() : getActiveScenario();
  const userRole = getRole();
  const showScenarioStatus = Boolean(linkedScenario) || userRole === "adviser" || userRole === "agent";
  const selectedPortfolioProperty = portfolioProperties.find((item) => item.id === cashflowContext?.propertyId)
    || portfolioProperties.find((item) => item.label === propertyDetails.nickname && (!propertyDetails.address || item.address === propertyDetails.address));
  const selectedPropertyId = cashflowContext?.propertyId || selectedPortfolioProperty?.id || "";
  const selectedFinancialYearNumber = getFinancialYearNumber(financialYear);
  const selectedFinancialPeriod = financialPeriods.find((period) => period.financialYear === financialYear) || getFinancialPeriod(selectedFinancialYearNumber);
  const copyTargetPeriod = financialPeriods.find((period) => period.financialYear === `FY${selectedFinancialYearNumber + 1}`) || getFinancialPeriod(selectedFinancialYearNumber + 1);
  const previousFinancialPeriod = financialPeriods.find((period) => period.financialYear === `FY${selectedFinancialYearNumber - 1}`) || getFinancialPeriod(selectedFinancialYearNumber - 1);
  const displayMonths = selectedFinancialPeriod.months;

  const switchCashflowView = (view: CashflowViewMode) => {
    setCashflowView(view);
    localStorage.setItem(CASHFLOW_VIEW_KEY, view);
  };

  const updateTaxSettings = (updates: Partial<CashflowTaxSettings>) => {
    setTaxSettings((current) => {
      const next = { ...current, ...updates };
      localStorage.setItem(CASHFLOW_TAX_SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const overallRows = useMemo(() => portfolioProperties.map((item) => {
    const context = { clientId: cashflowContext?.clientId, scenarioId: cashflowContext?.scenarioId || getActiveScenario()?.id || CURRENT_CASHFLOW_PLAN_ID, propertyId: item.id, propertyType: item.propertyType, financialYear };
    const record = getCashflowForProperty<CashflowState>(context);
    const summary = record?.state ? getAnnualCashflowSummary(record.state) : { income: 0, expenses: 0, net: 0, holdingCost: 0 };
    const taxOwnership: "personal" | "trust" | "smsf" = item.propertyType === "smsf" ? "smsf" : item.ownership;
    const estimatedTaxBenefit = estimateNegativeGearingBenefit(summary.net, taxSettings, taxOwnership);
    const afterTaxCashflow = summary.net + estimatedTaxBenefit;
    const rentalYield = item.estimatedValue > 0 ? ((item.weeklyRent * 52) / item.estimatedValue) * 100 : 0;
    return { ...item, hasWorksheet: Boolean(record?.state), ...summary, estimatedTaxBenefit, afterTaxCashflow, rentalYield, taxOwnership };
  }), [portfolioProperties, cashflowContext?.clientId, cashflowContext?.scenarioId, financialYear, taxSettings]);

  const overallTotals = useMemo(() => overallRows.reduce((acc, row) => ({
    income: acc.income + row.income,
    expenses: acc.expenses + row.expenses,
    net: acc.net + row.net,
    taxBenefit: acc.taxBenefit + row.estimatedTaxBenefit,
    afterTax: acc.afterTax + row.afterTaxCashflow,
  }), { income: 0, expenses: 0, net: 0, taxBenefit: 0, afterTax: 0 }), [overallRows]);

  const syncHorizontalScroll = (source: "top" | "table") => {
    if (syncingScrollRef.current) return;
    const from = source === "top" ? topScrollRef.current : tableScrollRef.current;
    const to = source === "top" ? tableScrollRef.current : topScrollRef.current;
    if (!from || !to) return;

    syncingScrollRef.current = true;
    to.scrollLeft = from.scrollLeft;
    requestAnimationFrame(() => {
      syncingScrollRef.current = false;
    });
  };

  useEffect(() => {
    const active = getActiveScenario();
    const context = getActiveCashflowContext();
    if (!active || !context || context.scenarioId === active.id) return;
    const ppor = active.state.ppor;
    const fallback = normalizeCashflowState({
      propertyDetails: {
        ...property,
          nickname: ppor?.nickname || active.state.pporSuburb || "",
          address: ppor?.address || "",
        owner: ppor?.ownership === "trust" ? ppor.trustName || "Trust" : "Personal",
        bank: ppor?.loan?.lenderName || "",
        weeklyRent: ppor?.rental?.weeklyRent || 0,
        interestRate: ppor?.loan?.interestRate || 0,
        loanAmount: ppor?.loanSplits?.length ? ppor.loanSplits.reduce((sum, split) => sum + (split.amount || 0), 0) : ppor?.loanBalance || 0,
        investmentType: ppor?.investmentType || "house",
        ownership: ppor?.ownership || "personal",
        trustName: ppor?.trustName || "",
      },
    });
    const nextContext = { clientId: active.clientId, scenarioId: active.id, propertyId: ppor?.id || "ppor", propertyType: "ppor" as CashflowPropertyType, financialYear };
    setActiveCashflowContext(nextContext);
    setCashflowContextState(nextContext);
    setRows(fallback.rows);
    setPropertyDetails(fallback.propertyDetails);
    setCouncilRates(fallback.councilRates);
    setInsurance(fallback.insurance);
    setLandTax(fallback.landTax);
    setWater(fallback.water);
    setActiveMonth(fallback.activeMonth);
  }, [financialYear]);

  useEffect(() => {
    setRows((current) => current.map((row) => {
      if (row.id === "rental-income") return { ...row, weeklyRent: propertyDetails.weeklyRent, values: Array(12).fill(monthlyRentFromWeekly(propertyDetails.weeklyRent)) };
      if (row.id === "agent-fees") return { ...row, values: Array(12).fill(monthlyAgentFee(propertyDetails.weeklyRent)) };
      if (row.id === "interest") return { ...row, values: Array(12).fill(monthlyInterestOnlyCost(propertyDetails.loanAmount, propertyDetails.interestRate)) };
      return row;
    }));
  }, [propertyDetails.weeklyRent, propertyDetails.loanAmount, propertyDetails.interestRate]);

  useEffect(() => {
    if (highlightFirstSplit && firstSplitAmountRef.current) {
      firstSplitAmountRef.current.focus();
      const valueLength = firstSplitAmountRef.current.value.length;
      firstSplitAmountRef.current.setSelectionRange(valueLength, valueLength);
      const timer = setTimeout(() => setHighlightFirstSplit(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightFirstSplit, propertyDetails.loanSplits]);

  useEffect(() => {
    if (!selectedPropertyId) return;
    const linked = getLinkedProperty(selectedPropertyId);
    if (!linked) return;
    setPropertyDetails((current) => syncPropertyDetailsFromLinkedProperty(current, linked));
  }, [selectedPropertyId, portfolioProperties]);

  useEffect(() => {
    const state = currentCashflowState();
    localStorage.setItem(CASHFLOW_WORKING_STATE_KEY, JSON.stringify(state));

    if (!cashflowContext) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    setAutosaveStatus("saving");
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const saved = saveCashflowForProperty({ ...cashflowContext, financialYear }, state, `${propertyDetails.nickname || propertyDetails.address || "Property"} ${financialYear}`);
      setCashflowContextState(saved);
      setAutosaveStatus("saved");
    }, 800);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [rows, propertyDetails, councilRates, insurance, landTax, water, activeMonth, cashflowContext?.propertyId, cashflowContext?.scenarioId, financialYear]);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((sum, row) => sum + row.values.reduce((a, b) => a + b, 0), 0);
    const expensesByMonth = displayMonths.map((_, i) => rows.filter((r) => r.type === "expense").reduce((sum, row) => sum + row.values[i], 0));
    const incomeByMonth = rows.find((r) => r.type === "income")?.values || [];
    const expenses = expensesByMonth.reduce((a, b) => a + b, 0);
    return { income, expenses, net: income - expenses, holdingCost: Math.max(expenses - income, 0), incomeByMonth, expensesByMonth };
  }, [rows, displayMonths]);

  const updateRow = (rowId: string, updates: Partial<CashflowRow>) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, ...updates } : row)));
  };

  const updateValue = (rowId: string, monthIndex: number, value: number) => {
    setRows((current) => current.map((row) => {
      if (row.id !== rowId) return row;
      const nextValues = [...row.values];
      nextValues[monthIndex] = value;
      return { ...row, values: nextValues };
    }));
  };

  const updateWeeklyRent = (rowId: string, weeklyRent: number) => {
    setRows((current) => current.map((row) => {
      if (row.id === rowId) {
        return { ...row, weeklyRent, values: Array(12).fill(monthlyRentFromWeekly(weeklyRent)) };
      }

      if (row.id === "agent-fees") {
        return { ...row, values: Array(12).fill(monthlyAgentFee(weeklyRent)) };
      }

      return row;
    }));
  };

  const updateInterestRow = (loanAmount: number, interestRate: number) => {
    updateRow("interest", { values: Array(12).fill(monthlyInterestOnlyCost(loanAmount, interestRate)) });
  };

  const updatePropertyWeeklyRent = (weeklyRent: number) => {
    setPropertyDetails((current) => ({ ...current, weeklyRent }));
    const rentalRow = rows.find((row) => row.type === "income");
    if (rentalRow) {
      updateWeeklyRent(rentalRow.id, weeklyRent);
    }
    syncLinkedPortfolioProperty({ weeklyRent });
  };

  const updateLinkedPortfolioProperty = (updater: (item: ExistingProperty) => ExistingProperty) => {
    const linkedId = selectedPropertyId;
    if (!linkedId) return null;
    let updatedProperty: ExistingProperty | null = null;

    if (linkedId === "ppor") {
      const stored = localStorage.getItem("portfolio-ppor");
      if (stored) {
        updatedProperty = updater(JSON.parse(stored) as ExistingProperty);
        localStorage.setItem("portfolio-ppor", JSON.stringify(updatedProperty));
      }
    } else {
      const existing = JSON.parse(localStorage.getItem("portfolio-properties") || "[]") as ExistingProperty[];
      localStorage.setItem("portfolio-properties", JSON.stringify(existing.map((item) => {
        if (item.id !== linkedId) return item;
        updatedProperty = updater(item);
        return updatedProperty;
      })));
    }
    setPortfolioProperties(getPortfolioPropertyOptions());
    if (updatedProperty) setPropertyDetails((current) => syncPropertyDetailsFromLinkedProperty(current, updatedProperty));
    return updatedProperty;
  };

  const syncLinkedPortfolioProperty = (updates: Partial<CashflowPropertyDetails>) => {
    updateLinkedPortfolioProperty((item) => ({
      ...item,
      nickname: updates.nickname ?? item.nickname,
      address: updates.address ?? item.address,
      ownership: updates.ownership ?? item.ownership,
      trustName: (updates.ownership ?? item.ownership) === "trust" ? updates.trustName ?? item.trustName : undefined,
      investmentType: updates.investmentType ?? item.investmentType,
      loanBalance: updates.loanAmount ?? item.loanBalance,
      loanSplits: updates.loanSplits ?? item.loanSplits,
      loan: { ...item.loan, lenderName: updates.bank ?? item.loan.lenderName, interestRate: updates.interestRate ?? item.loan.interestRate },
      rental: { ...item.rental, weeklyRent: updates.weeklyRent ?? item.rental.weeklyRent },
    }));
  };

  const updateLoanAmount = (loanAmount: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(loanAmount, current.interestRate);
      return { ...current, loanAmount };
    });
    syncLinkedPortfolioProperty({ loanAmount });
  };

  const updateInterestRate = (interestRate: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(current.loanAmount, interestRate);
      return { ...current, interestRate };
    });
    syncLinkedPortfolioProperty({ interestRate });
  };

  const updatePropertyIdentity = (updates: Partial<CashflowPropertyDetails>) => {
    setPropertyDetails((current) => {
      const next = { ...current, ...updates };
      syncLinkedPortfolioProperty(next);
      return next;
    });
  };

  const updateLoanSplits = (loanSplits: LoanSplit[]) => {
    const loanAmount = loanSplits.reduce((sum, split) => sum + (split.amount || 0), 0);
    const interestRate = loanSplits.find((split) => split.interestRate !== undefined)?.interestRate ?? propertyDetails.interestRate;
    setPropertyDetails((current) => ({ ...current, loanSplits, loanAmount, interestRate }));
    updateInterestRow(loanAmount, interestRate);
    syncLinkedPortfolioProperty({ loanSplits, loanAmount, interestRate });
  };

  const addRow = (type: CashflowRow["type"]) => {
    setRows((current) => [...current, { id: `${type}-${Date.now()}`, label: type === "income" ? "New income" : "New expense", type, values: Array(12).fill(0), ...(type === "income" ? { weeklyRent: 0 } : {}) }]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
  };

  const linkPortfolioProperty = (propertyId: string) => {
    const selected = portfolioProperties.find((item) => item.id === propertyId);
    if (!selected) return;
    setPropertySheetMode("current");
    skipNextAutosaveRef.current = true;
    const scenario = getActiveScenario();
    const nextContext = { clientId: scenario?.clientId, scenarioId: scenario?.id || CURRENT_CASHFLOW_PLAN_ID, propertyId: selected.id, propertyType: selected.propertyType, financialYear };
    setActiveCashflowContext(nextContext);
    setCashflowContextState(nextContext);
    const record = getCashflowForProperty<CashflowState>(nextContext);
    if (record?.state) {
      const normalized = normalizeCashflowState(record.state);
      const linked = getLinkedProperty(selected.id);
      setRows(normalized.rows);
      setPropertyDetails(syncPropertyDetailsFromLinkedProperty(normalized.propertyDetails, linked));
      setCouncilRates(normalized.councilRates);
      setInsurance(normalized.insurance);
      setLandTax(normalized.landTax);
      setWater(normalized.water);
      setActiveMonth(normalized.activeMonth);
      setAutosaveStatus("saved");
      toast.success(`Loaded ${selected.label} cashflow`);
      return;
    }
    setPropertyDetails((current) => ({
      ...current,
      ...syncPropertyDetailsFromLinkedProperty(current, getLinkedProperty(selected.id)),
    }));
    setAutosaveStatus("idle");
    toast.success(`Loaded ${selected.label}`);
  };

  const addNewPortfolioProperty = () => {
    const propertyId = crypto.randomUUID();
    const newProperty: ExistingProperty = {
      id: propertyId,
      nickname: propertyDetails.nickname || "New property",
      address: propertyDetails.address,
      estimatedValue: 0,
      loanBalance: propertyDetails.loanAmount || 0,
      loanSplits: propertyDetails.loanSplits,
      earmarked: false,
      sellInYears: 0,
      ownership: propertyDetails.ownership,
      trustName: propertyDetails.ownership === "trust" ? propertyDetails.trustName : undefined,
      investmentType: propertyDetails.investmentType,
      loan: { ...defaultLoanDetails, lenderName: propertyDetails.bank, interestRate: propertyDetails.interestRate },
      rental: { ...defaultRentalDetails, weeklyRent: propertyDetails.weeklyRent },
      purchase: { ...defaultPurchaseDetails },
    };
    const existing = JSON.parse(localStorage.getItem("portfolio-properties") || "[]") as ExistingProperty[];
    localStorage.setItem("portfolio-properties", JSON.stringify([...existing, newProperty]));
    setPortfolioProperties(getPortfolioPropertyOptions());
    const scenario = getActiveScenario();
    if (scenario) {
      const nextContext = { clientId: scenario.clientId, scenarioId: scenario.id, propertyId, propertyType: "investment" as CashflowPropertyType, financialYear };
      setActiveCashflowContext(nextContext);
      setCashflowContextState(nextContext);
    }
    setPropertyDetails((current) => ({ ...current, nickname: newProperty.nickname }));
    toast.success("Added new portfolio property");
  };

  const openPropertyDetailsSheet = (mode: "current" | "new") => {
    setPropertySheetMode(mode);
    if (mode === "new") {
      setPropertyDetails({ ...property, nickname: "New property" });
    }
    setPropertySheetOpen(true);
  };

  const savePropertyDetailsFromSheet = () => {
    const linkedId = selectedPropertyId;
    const isLinkedPortfolioProperty = linkedId && linkedId !== "ppor" && propertySheetMode === "current";
    if (isLinkedPortfolioProperty) {
      syncLinkedPortfolioProperty(propertyDetails);
      toast.success("Property details updated");
    } else if (linkedId === "ppor" && propertySheetMode === "current") {
      syncLinkedPortfolioProperty(propertyDetails);
      toast.success("Property details updated");
    } else {
      addNewPortfolioProperty();
    }
    setPropertySheetOpen(false);
  };

  const currentCashflowState = (): CashflowState => ({ rows, propertyDetails, councilRates, insurance, landTax, water, activeMonth, templateVersion: CASHFLOW_TEMPLATE_VERSION });

  const handleFyDocsUpload = (files: FileList | null, input?: HTMLInputElement) => {
    if (!files?.length) return;
    const nextItems = createCashflowDocumentPlaceholders(Array.from(files));
    setFyDocItems((current) => [...current, ...nextItems]);
    setFyDocsReviewOpen(true);
    if (input) input.value = "";
    const failedCount = nextItems.filter((item) => item.status === "failed").length;
    toast.info(`${nextItems.length - failedCount} document${nextItems.length - failedCount === 1 ? "" : "s"} ready for review${failedCount ? `, ${failedCount} unsupported` : ""}.`);
  };

  const updateRecurringUtility = (category: ExtractedCashflowItem["category"], amount: number, frequency: CashflowDocumentFrequency) => {
    if (category === "council") return updateCouncilRates({ amount, frequency });
    if (category === "insurance") return updateInsurance({ amount, frequency });
    if (category === "land-tax") return updateLandTax({ amount, frequency });
    if (category === "water") return updateWater({ amount, frequency });
  };

  const applyReviewedFyDocs = (itemsToApply: ExtractedCashflowItem[]) => {
    const recurringUtilityIds = new Set<string>();
    itemsToApply.forEach((item) => {
      if (item.recurring?.isRecurring && item.recurring.frequency && ["council", "insurance", "land-tax", "water"].includes(item.category)) {
        updateRecurringUtility(item.category, item.amount || 0, item.recurring.frequency);
        recurringUtilityIds.add(item.id);
      }
    });

    setRows((current) => current.map((row) => {
      const matchingItems = itemsToApply.filter((item) => !recurringUtilityIds.has(item.id) && item.category === row.id && item.monthIndex !== undefined && item.amount);
      if (matchingItems.length === 0) return row;
      const nextValues = [...row.values];
      matchingItems.forEach((item) => {
        nextValues[item.monthIndex!] = (nextValues[item.monthIndex!] || 0) + (item.amount || 0);
      });
      return { ...row, values: nextValues };
    }));

    setFyDocItems((current) => current.filter((item) => !itemsToApply.some((applied) => applied.id === item.id)));
    setFyDocsReviewOpen(false);
    toast.success(`${itemsToApply.length} document item${itemsToApply.length === 1 ? "" : "s"} applied to cashflow`);
  };

  const showCloudImportPlaceholder = (service: string) => {
    toast.info(`${service} import will be connected with the backend cloud auth work.`);
  };

  const handlePeriodChange = (nextYear: string) => {
    setFinancialYear(nextYear);
    if (!cashflowContext) return;
    skipNextAutosaveRef.current = true;
    const nextContext = { ...cashflowContext, financialYear: nextYear };
    setActiveCashflowContext(nextContext);
    setCashflowContextState(nextContext);
    const record = getCashflowForProperty<CashflowState>(nextContext);
    if (record?.state) {
      const normalized = normalizeCashflowState(record.state);
      const linked = getLinkedProperty(nextContext.propertyId);
      setRows(normalized.rows);
      setPropertyDetails(syncPropertyDetailsFromLinkedProperty(normalized.propertyDetails, linked));
      setCouncilRates(normalized.councilRates);
      setInsurance(normalized.insurance);
      setLandTax(normalized.landTax);
      setWater(normalized.water);
      setActiveMonth(normalized.activeMonth);
      setAutosaveStatus("saved");
      return;
    }
    setAutosaveStatus("idle");
  };

  const saveCashflowScenario = () => {
    const name = saveName.trim() || `Cashflow ${savedScenarios.length + 1}`;
    const existing = savedScenarios.find((scenario) => scenario.name.toLowerCase() === name.toLowerCase());
    const nextScenario: SavedCashflowScenario = { id: existing?.id || crypto.randomUUID(), name, savedAt: new Date().toISOString(), state: currentCashflowState() };
    const nextScenarios = existing ? savedScenarios.map((scenario) => scenario.id === existing.id ? nextScenario : scenario) : [...savedScenarios, nextScenario];
    localStorage.setItem(CASHFLOW_SCENARIOS_KEY, JSON.stringify(nextScenarios));
    localStorage.setItem(ACTIVE_CASHFLOW_SCENARIO_KEY, nextScenario.id);
    localStorage.setItem(CASHFLOW_WORKING_STATE_KEY, JSON.stringify(nextScenario.state));
    setSavedScenarios(nextScenarios);
    setActiveScenarioId(nextScenario.id);
    setSaveName("");
    toast.success(`${existing ? "Updated" : "Saved"} "${name}"`);
  };

  const updateActiveCashflowScenario = () => {
    if (cashflowContext) {
      const saved = saveCashflowForProperty({ ...cashflowContext, financialYear }, currentCashflowState(), `${propertyDetails.nickname || propertyDetails.address || "Property"} ${financialYear}`);
      setCashflowContextState(saved);
      toast.success(`Saved ${financialYear} cashflow`);
      return;
    }
    if (!activeScenarioId) return saveCashflowScenario();
    const active = savedScenarios.find((scenario) => scenario.id === activeScenarioId);
    if (!active) return saveCashflowScenario();
    const nextScenarios = savedScenarios.map((scenario) => scenario.id === activeScenarioId ? { ...scenario, savedAt: new Date().toISOString(), state: currentCashflowState() } : scenario);
    localStorage.setItem(CASHFLOW_SCENARIOS_KEY, JSON.stringify(nextScenarios));
    localStorage.setItem(CASHFLOW_WORKING_STATE_KEY, JSON.stringify(currentCashflowState()));
    setSavedScenarios(nextScenarios);
    toast.success(`Updated "${active.name}"`);
  };

  const saveAsNewPeriod = () => {
    if (!cashflowContext) return updateActiveCashflowScenario();
    const nextContext = { ...cashflowContext, financialYear: copyTargetPeriod.financialYear };
    saveCashflowForProperty(nextContext, currentCashflowState(), `${propertyDetails.nickname || propertyDetails.address || "Property"} ${copyTargetPeriod.financialYear}`);
    setActiveCashflowContext({ ...cashflowContext, financialYear });
    toast.success(`Copied ${selectedFinancialPeriod.label} to ${copyTargetPeriod.label}`);
  };

  const copyFromPreviousPeriod = () => {
    if (!cashflowContext || !previousFinancialPeriod) return;
    const previousContext = { ...cashflowContext, financialYear: previousFinancialPeriod.financialYear };
    const previousRecord = getCashflowForProperty<CashflowState>(previousContext);
    if (!previousRecord?.state) {
      toast.info(`No ${previousFinancialPeriod.label} cashflow to copy`);
      return;
    }
    const normalized = normalizeCashflowState(previousRecord.state);
    const linked = getLinkedProperty(cashflowContext.propertyId);
    const nextState = { ...normalized, propertyDetails: syncPropertyDetailsFromLinkedProperty(normalized.propertyDetails, linked) };
    saveCashflowForProperty({ ...cashflowContext, financialYear }, nextState, `${propertyDetails.nickname || propertyDetails.address || "Property"} ${financialYear}`);
    setRows(nextState.rows);
    setPropertyDetails(nextState.propertyDetails);
    setCouncilRates(nextState.councilRates);
    setInsurance(nextState.insurance);
    setLandTax(nextState.landTax);
    setWater(nextState.water);
    setActiveMonth(nextState.activeMonth);
    setAutosaveStatus("saved");
    toast.success(`Copied ${previousFinancialPeriod.label} to ${selectedFinancialPeriod.label}`);
  };

  const loadCashflowScenario = (scenario: SavedCashflowScenario) => {
    const normalizedState = normalizeCashflowState(scenario.state);
    setRows(normalizedState.rows);
    setPropertyDetails(normalizedState.propertyDetails);
    setCouncilRates(normalizedState.councilRates);
    setInsurance(normalizedState.insurance);
    setLandTax(normalizedState.landTax);
    setWater(normalizedState.water);
    setActiveMonth(normalizedState.activeMonth);
    setActiveScenarioId(scenario.id);
    localStorage.setItem(ACTIVE_CASHFLOW_SCENARIO_KEY, scenario.id);
    localStorage.setItem(CASHFLOW_WORKING_STATE_KEY, JSON.stringify(normalizedState));
    toast.success(`Loaded "${scenario.name}"`);
  };

  const updateCouncilRates = (updates: Partial<typeof councilRates>) => {
    const next = { ...councilRates, ...updates };
    setCouncilRates(next);
    updateRow("council", { values: scheduledExpenseValues(next.amount, next.frequency) });
  };

  const updateInsurance = (updates: Partial<InsuranceState>) => {
    const next = { ...insurance, ...updates };
    setInsurance(next);
    updateRow("insurance", { values: scheduledExpenseValues(next.amount, next.frequency) });
  };

  const updateLandTax = (updates: Partial<LandTaxState>) => {
    const next = { ...landTax, ...updates };
    setLandTax(next);
    updateRow("land-tax", { values: scheduledExpenseValues(next.amount, next.frequency) });
  };

  const updateWater = (updates: Partial<WaterState>) => {
    const next = { ...water, ...updates };
    setWater(next);
    updateRow("water", { values: scheduledExpenseValues(next.amount, next.frequency) });
  };

  const exportCashflowSummary = () => {
    if (cashflowView === "overall") {
      const csvRows = [
        ["Overall cashflow", selectedFinancialPeriod.label],
        [],
        ["Property", "Ownership", "Current Value", "Current Loan", "Weekly Rent", "Annual Rental Income", "Annual Expenses", "Net Annual Cashflow", "Holding Cost", "Rental Yield", "Estimated Tax Benefit", "After-tax Annual Cashflow", "Status"],
        ...overallRows.map((row) => [row.label, row.owner, formatCurrency(row.estimatedValue), formatCurrency(row.loanAmount), formatCurrency(row.weeklyRent), formatCurrency(row.income), formatCurrency(row.expenses), formatCurrency(row.net), formatCurrency(row.holdingCost), formatPercent(row.rentalYield), formatCurrency(row.estimatedTaxBenefit), formatCurrency(row.afterTaxCashflow), row.net > 0 ? "Positive" : row.net < 0 ? "Negative" : "Neutral"]),
        [],
        ["Portfolio before tax", formatCurrency(overallTotals.net)],
        ["Estimated negative gearing benefit", formatCurrency(overallTotals.taxBenefit)],
        ["After-tax cashflow estimate", formatCurrency(overallTotals.afterTax)],
      ];
      const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      link.download = `cashflow-overall-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Overall cashflow summary exported");
      return;
    }

    const populatedPropertyFields = [
      ["Owner", propertyDetails.owner],
      ["Address", propertyDetails.address],
      ["Manager", propertyDetails.manager],
      ["Bank", propertyDetails.bank],
      ["Loan Amount", propertyDetails.loanAmount ? formatCurrency(propertyDetails.loanAmount) : ""],
      ["Interest Rate", propertyDetails.interestRate ? `${propertyDetails.interestRate}%` : ""],
      ["Weekly Rent", propertyDetails.weeklyRent ? formatCurrency(propertyDetails.weeklyRent) : ""],
    ].filter(([, value]) => String(value).trim() !== "");
    const populatedRows = rows.filter((row) => row.label.trim() && row.values.some((value) => value > 0));
    const csvRows = [
      ["Property details", "Value"],
      ...populatedPropertyFields,
      [],
      ["Totals", "Amount"],
      ["Annual Income", formatCurrency(totals.income)],
      ["Rental Expenses", formatCurrency(totals.expenses)],
      ["Cashflow end of year", formatCurrency(totals.net)],
      [],
      ["Detailed Breakdown", ...displayMonths, "Subtotal"],
      ...populatedRows.map((row) => [row.label, ...row.values.map(formatCurrency), formatCurrency(row.values.reduce((sum, value) => sum + value, 0))]),
      ["Total Income", ...totals.incomeByMonth.map(formatCurrency), formatCurrency(totals.income)],
      ["Total Expenses", ...totals.expensesByMonth.map(formatCurrency), formatCurrency(totals.expenses)],
      ["Net Profit / (Loss)", ...totals.incomeByMonth.map((value, index) => formatCurrency(value - totals.expensesByMonth[index])), formatCurrency(totals.net)],
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = `cashflow-summary-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Cashflow summary exported");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-header text-primary-foreground">
        <div className="container mx-auto px-4 py-5 md:py-12">
          <div className="mb-3 flex items-center justify-between gap-4 md:mb-5">
            <button
              onClick={() => navigate("/")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-accent/30 bg-accent/15 text-accent transition-all hover:border-accent/50 hover:bg-accent/25 md:h-14 md:w-14"
              aria-label="Back to Dashboard"
            >
              <LayoutDashboard size={22} className="md:hidden" />
              <LayoutDashboard size={32} className="hidden md:block" />
            </button>
            <div className="flex items-center gap-2 md:gap-4">
              <UserMenu />
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-1 text-xl font-bold md:mb-3 md:text-5xl">Cashflow Tracker</h1>
              <p className="max-w-2xl text-sm font-light text-accent md:text-xl">Track your properties on-going expenses and income</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="mb-4">
          <ScenarioContextBanner compact />
        </div>
        <div className="mb-4 inline-grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/30 p-1">
          {(["detail", "overall"] as CashflowViewMode[]).map((view) => (
            <button key={view} onClick={() => switchCashflowView(view)} className={`min-h-11 rounded-md px-4 text-sm font-bold transition-colors ${cashflowView === view ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60"}`}>
              {view === "detail" ? "Detail view" : "Overall view"}
            </button>
          ))}
        </div>
        {cashflowView === "detail" ? <>
        <section className="grid items-stretch gap-4 xl:grid-cols-8">
          <div
            onClick={() => openPropertyDetailsSheet("current")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPropertyDetailsSheet("current");
              }
            }}
            role="button"
            tabIndex={0}
            className="group h-full min-h-full w-full cursor-pointer self-stretch rounded-xl border-2 border-border bg-card p-4 text-left shadow-md transition-all hover:border-accent hover:shadow-xl hover:shadow-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 xl:col-span-4"
            aria-label="Edit property details"
          >
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="grid gap-3 sm:grid-cols-3 sm:items-start">
                <div className="flex min-h-11 min-w-0 flex-col justify-center">
                  <div className="flex min-w-0 items-center gap-2">
                    <InvestmentTypeIcon type={propertyDetails.investmentType} size={18} className="shrink-0 text-accent" />
                    <p className="truncate text-base font-semibold text-foreground">{propertyDetails.nickname || "Untitled property"}</p>
                  </div>
                  {propertyDetails.address && <p className="mt-1 truncate text-sm text-muted-foreground">{propertyDetails.address}</p>}
                </div>
                <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                  <select value={selectedPropertyId} onChange={(event) => linkPortfolioProperty(event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground">
                    <option value="" disabled>Select property</option>
                    {portfolioProperties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </div>
                <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                  <button onClick={() => openPropertyDetailsSheet("new")} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> New property</button>
                </div>
              </div>
              <div className="grid content-start gap-x-3 gap-y-4 border-t border-border/70 pt-4 sm:grid-cols-3">
                <SummaryMeasure icon={Percent} label="Interest rate" value={formatInterestRate(propertyDetails.interestRate)} />
                <SummaryMeasure icon={Home} label="Weekly rent" value={formatCurrency(propertyDetails.weeklyRent)} />
                <SummaryMeasure icon={TrendingDown} label="Total expenses" value={formatCurrency(totals.expenses)} />
                <SummaryMeasure icon={Banknote} label="Total loan amount" value={formatCurrency(propertyDetails.loanAmount)} />
                <SummaryMeasure icon={Banknote} label="Rental income" value={formatCurrency(totals.income)} />
                <SummaryMeasure icon={CalendarDays} label="Yearly cashflow" value={formatCurrency(totals.holdingCost)} highlight={totals.holdingCost > 0} />
              </div>
              <div className="grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-3">
                <div className="flex items-center">
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {propertyDetails.ownership === "trust" ? propertyDetails.trustName || "Trust" : "Personal"}
                  </span>
                </div>
                <div className="flex items-center">
                  {propertyDetails.bank && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Bank: {propertyDetails.bank}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  {propertyDetails.manager && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Property Manager: {propertyDetails.manager}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="order-3 flex h-full min-h-full flex-col self-stretch rounded-xl border border-border bg-card p-4 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays size={18} className="text-accent" />
              <h2 className="text-base font-bold text-foreground">FY Docs</h2>
            </div>
            <div className="grid gap-3">
              <button onClick={() => setFyDocsSourceOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90">
                <Upload size={16} /> Upload docs
              </button>
              <input ref={deviceUploadRef} type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.xls" className="sr-only" onChange={(event) => handleFyDocsUpload(event.target.files, event.currentTarget)} />
              <input ref={phoneUploadRef} type="file" multiple accept="image/*,.pdf" capture="environment" className="sr-only" onChange={(event) => handleFyDocsUpload(event.target.files, event.currentTarget)} />
              {fyDocItems.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground">{fyDocItems.length} document{fyDocItems.length === 1 ? "" : "s"}</p>
                    <button onClick={() => setFyDocsReviewOpen(true)} className="text-xs font-bold text-accent hover:underline">Review</button>
                  </div>
                  <div className="max-h-28 space-y-1 overflow-y-auto scrollbar-thin">
                    {fyDocItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText size={13} className="shrink-0 text-accent" />
                        <span className="min-w-0 flex-1 truncate">{item.fileName}</span>
                        <span className={item.status === "failed" ? "font-semibold text-destructive" : "font-semibold text-muted-foreground"}>{item.status === "failed" ? "Unsupported" : "Needs review"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <select value={financialYear} onChange={(event) => handlePeriodChange(event.target.value)} className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground">
                {financialPeriods.map((period) => <option key={period.financialYear} value={period.financialYear}>{period.label}</option>)}
              </select>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {showScenarioStatus && (
                <p className="font-semibold text-foreground">Scenario: {linkedScenario?.name || "No active scenario"}</p>
              )}
              {autosaveStatus === "saving" && <p className="font-semibold text-accent">Saving…</p>}
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                <button onClick={copyFromPreviousPeriod} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border px-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50">
                  <Copy size={16} /> Copy from {previousFinancialPeriod.label.replace(" ", "")}
                </button>
                <button onClick={saveAsNewPeriod} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border px-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                  <Copy size={16} /> Copy → {copyTargetPeriod.label.replace(" ", "")}
                </button>
                </div>
                <button onClick={exportCashflowSummary} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                  <Download size={16} /> Export summary
                </button>
              </div>
            </div>
          </div>
          <div className="order-2 flex h-full min-h-full flex-col self-stretch rounded-xl border border-border bg-card p-3 shadow-sm xl:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="flex min-w-0 items-center gap-2 text-sm font-bold text-foreground">
                <Banknote size={16} className="shrink-0 text-accent" />
                <span className="truncate">Utilities & Charges</span>
              </h2>
              <button onClick={() => addRow("expense")} className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-border px-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted" aria-label="Add charge">
                <Plus size={14} /> Add
              </button>
            </div>
            <div className="grid flex-1 grid-rows-4">
              <ExpenseControl label="Council rates" value={councilRates.amount} frequency={councilRates.frequency} onAmountChange={(amount) => updateCouncilRates({ amount })} onFrequencyChange={(frequency) => updateCouncilRates({ frequency })} />
              <ExpenseControl label="Insurance" value={insurance.amount} frequency={insurance.frequency} onAmountChange={(amount) => updateInsurance({ amount })} onFrequencyChange={(frequency) => updateInsurance({ frequency })} />
              <ExpenseControl label="Land tax" value={landTax.amount} frequency={landTax.frequency} onAmountChange={(amount) => updateLandTax({ amount })} onFrequencyChange={(frequency) => updateLandTax({ frequency })} />
              <ExpenseControl label="Water charges" value={water.amount} frequency={water.frequency} onAmountChange={(amount) => updateWater({ amount })} onFrequencyChange={(frequency) => updateWater({ frequency })} />
            </div>
          </div>
        </section>

        <FyDocsUploadSourceDialog
          open={fyDocsSourceOpen}
          onOpenChange={setFyDocsSourceOpen}
          onDeviceUpload={() => deviceUploadRef.current?.click()}
          onPhoneUpload={() => phoneUploadRef.current?.click()}
          onCloudPlaceholder={showCloudImportPlaceholder}
        />

        <FyDocsReviewDialog
          open={fyDocsReviewOpen}
          onOpenChange={setFyDocsReviewOpen}
          items={fyDocItems}
          months={displayMonths}
          onItemsChange={setFyDocItems}
          onApply={applyReviewedFyDocs}
        />

        <Sheet open={propertySheetOpen} onOpenChange={setPropertySheetOpen}>
          <SheetContent className="w-full overflow-y-auto bg-card sm:max-w-lg">
            <SheetHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Home size={20} className="text-accent" />
                <SheetTitle>{propertySheetMode === "new" ? "Add property" : "Property details"}</SheetTitle>
              </div>
            </SheetHeader>
            <div className="space-y-6 pt-6">
              <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
                <button onClick={() => setPropertySheetMode("current")} className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${propertySheetMode === "current" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60"}`}>
                  Use existing
                </button>
                <button onClick={() => openPropertyDetailsSheet("new")} className={`min-h-11 rounded-md px-3 text-sm font-semibold transition-colors ${propertySheetMode === "new" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60"}`}>
                  Add new
                </button>
              </div>

              {propertySheetMode === "current" && (
                <div className="space-y-2 rounded-lg border border-border p-3">
                  <select onChange={(event) => linkPortfolioProperty(event.target.value)} value={selectedPropertyId} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <option value="" disabled>Select existing portfolio property</option>
                    {portfolioProperties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                  <p className="text-xs text-muted-foreground">Shared fields below are prefilled from the selected property and can be reviewed before saving.</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Property Details</h3>
                <PropertySheetField label="Investment Type">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {investmentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => updatePropertyIdentity({ investmentType: type })}
                        className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${propertyDetails.investmentType === type ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-muted-foreground hover:border-accent/50 hover:text-foreground"}`}
                      >
                        <InvestmentTypeIcon type={type} size={20} />
                        {getInvestmentTypeLabel(type)}
                      </button>
                    ))}
                  </div>
                </PropertySheetField>
                <PropertySheetField label="Ownership Structure">
                  <OwnershipToggle
                    value={propertyDetails.ownership}
                    onChange={(ownership) => updatePropertyIdentity({ ownership, owner: ownership === "trust" ? propertyDetails.trustName || "Trust" : "Personal" })}
                    trustName={propertyDetails.trustName}
                    onTrustNameChange={(trustName) => updatePropertyIdentity({ trustName, owner: trustName || "Trust" })}
                  />
                </PropertySheetField>
                <PropertySheetField label="Property Nickname">
                  <Input value={propertyDetails.nickname} onChange={(event) => updatePropertyIdentity({ nickname: event.target.value })} placeholder="e.g. Brisbane townhouse" className="h-10" />
                </PropertySheetField>
                <PropertySheetField label="Full Address (Optional)">
                  <AddressSearchInput value={propertyDetails.address} onChange={(value) => updatePropertyIdentity({ address: value })} placeholder="Search address or enter manually" className="h-10" />
                </PropertySheetField>
              </div>
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loan & Rental Details</h3>
                <LoanSplitsEditor
                  loanAmount={propertyDetails.loanAmount}
                  interestRate={propertyDetails.interestRate}
                  loanSplits={propertyDetails.loanSplits}
                  nickname={propertyDetails.nickname}
                  highlightFirstSplit={highlightFirstSplit}
                  firstSplitAmountRef={firstSplitAmountRef}
                  onFocusFirstSplit={() => setHighlightFirstSplit(true)}
                  onCreateFirstSplit={() => updateLoanSplits([{ id: crypto.randomUUID(), label: propertyDetails.nickname || "Primary Loan", amount: propertyDetails.loanAmount, interestRate: propertyDetails.interestRate, loanTermYears: 30, interestOnlyPeriodYears: 0, offsetBalance: 0 }])}
                  onChange={updateLoanSplits}
                />
                <PropertySheetField label="Lender / Bank">
                  <Input value={propertyDetails.bank} onChange={(event) => updatePropertyIdentity({ bank: event.target.value })} className="h-10" />
                </PropertySheetField>
                <PropertySheetField label="Weekly Rent">
                  <CurrencyEntryField value={propertyDetails.weeklyRent} onChange={updatePropertyWeeklyRent} />
                </PropertySheetField>
                <PropertySheetField label="Property Manager">
                  <Input value={propertyDetails.manager} onChange={(event) => setPropertyDetails((current) => ({ ...current, manager: event.target.value }))} className="h-10" />
                </PropertySheetField>
              </div>
              <button onClick={savePropertyDetailsFromSheet} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                <Save size={16} /> {propertySheetMode === "new" ? "Add and link property" : "Save property details"}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Monthly cashflow worksheet</h2>
              <p className="text-sm text-muted-foreground">Edit weekly rents, row labels and monthly values directly in the worksheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => addRow("income")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Income row</button>
              <button onClick={() => addRow("expense")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Expense row</button>
            </div>
          </div>
          <div ref={topScrollRef} onScroll={() => syncHorizontalScroll("top")} className="overflow-x-auto border-b border-border bg-muted/20 scrollbar-thin">
            <div className="h-3 min-w-[1120px] lg:min-w-full" />
          </div>
          <div ref={tableScrollRef} onScroll={() => syncHorizontalScroll("table")} className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-xs lg:min-w-0 lg:text-sm">
              <colgroup>
                <col className="w-[168px] sm:w-[210px] lg:w-[18%]" />
                {displayMonths.map((month) => <col key={month} className="w-[70px] lg:w-[5.8%]" />)}
                <col className="w-[88px] lg:w-[7.2%]" />
                <col className="w-[72px] lg:w-[5.4%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                   <th className="sticky left-0 z-30 bg-muted px-2 py-2 text-left font-bold text-foreground shadow-[6px_0_12px_-12px_hsl(var(--foreground))] sm:px-3 lg:px-4">Cashflow item</th>
                  {displayMonths.map((month, i) => (
                    <th key={month} className="px-1 py-2 text-right lg:px-1.5">
                      <button onClick={() => setActiveMonth(i)} className={`min-h-11 w-full rounded-lg px-1 text-xs font-bold transition-colors lg:text-sm ${activeMonth === i ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"}`}>
                        {month}
                      </button>
                    </th>
                  ))}
                  <th className="sticky right-[4.5rem] z-30 bg-muted px-2 py-2 text-right font-bold text-foreground shadow-[-6px_0_12px_-12px_hsl(var(--foreground))] lg:right-[5.4%]">Total</th>
                  <th className="sticky right-0 z-30 bg-muted px-2 py-2 text-center font-bold text-foreground">Remove</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 hover:bg-muted/30">
                    <td className="sticky left-0 z-20 bg-card px-2 py-2 font-medium text-foreground shadow-[6px_0_12px_-12px_hsl(var(--foreground))] sm:px-3 lg:px-4">
                      <div className="flex items-center gap-2">
                        <Input value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} className="h-11 bg-card px-2 text-xs font-semibold lg:h-10 lg:text-sm" />
                        <span className="shrink-0 text-sm font-bold text-accent">$</span>
                      </div>
                    </td>
                    {row.values.map((value, i) => (
                      <td key={i} className={`px-1 py-2 text-right tabular-nums lg:px-1.5 ${activeMonth === i ? "bg-accent/10 font-bold text-foreground" : "text-muted-foreground"}`}>
                        <div className="flex h-11 items-center rounded-md border border-input bg-background px-1 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 lg:h-10 lg:px-2">
                          <input inputMode="numeric" value={value || ""} onChange={(event) => updateValue(row.id, i, parseCurrencyValue(event.target.value))} className="min-w-0 flex-1 bg-transparent text-right text-xs text-foreground outline-none tabular-nums lg:text-sm" />
                        </div>
                      </td>
                    ))}
                    <td className="sticky right-[4.5rem] z-20 bg-card px-2 py-2 text-right font-bold tabular-nums text-foreground shadow-[-6px_0_12px_-12px_hsl(var(--foreground))] lg:right-[5.4%]">{formatCurrency(row.values.reduce((a, b) => a + b, 0))}</td>
                    <td className="sticky right-0 z-20 bg-card px-2 py-2 text-center">
                      <button onClick={() => removeRow(row.id)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Remove ${row.label}`}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
                <SummaryRow label="Total Expenses" values={totals.expensesByMonth} total={totals.expenses} />
                <SummaryRow label="Net Profit / (Loss)" values={totals.incomeByMonth.map((v, i) => v - totals.expensesByMonth[i])} total={totals.net} />
              </tbody>
            </table>
          </div>
        </section>
        </> : <OverallCashflowView rows={overallRows} totals={overallTotals} financialYear={financialYear} financialPeriods={financialPeriods} taxSettings={taxSettings} onFinancialYearChange={handlePeriodChange} onTaxSettingsChange={updateTaxSettings} onOpenDetail={(propertyId) => { linkPortfolioProperty(propertyId); switchCashflowView("detail"); }} />}

      </main>
    </div>
  );
};

type ExpenseFrequency = "annual" | "quarterly" | "monthly";

const OverallCashflowView = ({ rows, totals, financialYear, financialPeriods, taxSettings, onFinancialYearChange, onTaxSettingsChange, onOpenDetail }: { rows: CashflowOverviewRow[]; totals: { income: number; expenses: number; net: number; taxBenefit: number; afterTax: number }; financialYear: string; financialPeriods: FinancialPeriodOption[]; taxSettings: CashflowTaxSettings; onFinancialYearChange: (year: string) => void; onTaxSettingsChange: (updates: Partial<CashflowTaxSettings>) => void; onOpenDetail: (propertyId: string) => void }) => (
  <section className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">
      <SummaryPanel label="Portfolio before tax" value={formatCurrency(totals.net)} />
      <SummaryPanel label="Estimated negative gearing benefit" value={formatCurrency(totals.taxBenefit)} />
      <SummaryPanel label="After-tax cashflow estimate" value={formatCurrency(totals.afterTax)} />
    </div>

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Overall cashflow</h2>
            <p className="text-sm text-muted-foreground">Annual property comparison for the selected financial year.</p>
          </div>
          <select value={financialYear} onChange={(event) => onFinancialYearChange(event.target.value)} className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground">
            {financialPeriods.map((period) => <option key={period.financialYear} value={period.financialYear}>{period.label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                {['Property', 'Value', 'Loan', 'Weekly rent', 'Income p.a.', 'Expenses p.a.', 'Net p.a.', 'Holding cost', 'Rental yield', 'Tax benefit', 'After-tax p.a.', 'Status', ''].map((heading) => <th key={heading} className="px-3 py-3 text-left font-bold">{heading}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => <tr key={row.id} className="border-b border-border/70">
                <td className="px-3 py-3"><p className="font-bold text-foreground">{row.label}</p><p className="text-xs text-muted-foreground">{row.owner}{!row.hasWorksheet ? ' · No worksheet yet' : ''}{row.taxOwnership !== 'personal' && row.net < 0 ? ' · Tax varies' : ''}</p></td>
                <td className="px-3 py-3 font-semibold text-foreground">{formatCurrency(row.estimatedValue)}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{formatCurrency(row.loanAmount)}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{formatCurrency(row.weeklyRent)}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{row.hasWorksheet ? formatCurrency(row.income) : '—'}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{row.hasWorksheet ? formatCurrency(row.expenses) : '—'}</td>
                <td className="px-3 py-3 font-bold text-foreground">{row.hasWorksheet ? formatCurrency(row.net) : '—'}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{row.hasWorksheet ? formatCurrency(row.holdingCost) : '—'}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{formatPercent(row.rentalYield)}</td>
                <td className="px-3 py-3 font-semibold text-foreground">{row.estimatedTaxBenefit ? formatCurrency(row.estimatedTaxBenefit) : '—'}</td>
                <td className="px-3 py-3 font-bold text-foreground">{row.hasWorksheet ? formatCurrency(row.afterTaxCashflow) : '—'}</td>
                <td className="px-3 py-3"><StatusBadge value={row.net} hasWorksheet={row.hasWorksheet} /></td>
                <td className="px-3 py-3"><button onClick={() => onOpenDetail(row.id)} className="min-h-11 rounded-lg border border-border px-3 text-xs font-bold text-foreground transition-colors hover:bg-muted">Open detail</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">Income & tax estimate</h2>
        <p className="mt-1 text-sm text-muted-foreground">Estimate only, not tax advice.</p>
        <div className="mt-4 space-y-3">
          <PropertySheetField label="Your taxable income"><CurrencyEntryField value={taxSettings.primaryIncome} onChange={(primaryIncome) => onTaxSettingsChange({ primaryIncome })} /></PropertySheetField>
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm font-semibold text-foreground"><span>Include partner</span><input type="checkbox" checked={taxSettings.includePartner} onChange={(event) => onTaxSettingsChange({ includePartner: event.target.checked })} /></label>
          {taxSettings.includePartner && <PropertySheetField label="Partner taxable income"><CurrencyEntryField value={taxSettings.partnerIncome} onChange={(partnerIncome) => onTaxSettingsChange({ partnerIncome })} /></PropertySheetField>}
          <label className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border px-3 text-sm font-semibold text-foreground"><span>Include Medicare levy</span><input type="checkbox" checked={taxSettings.includeMedicare} onChange={(event) => onTaxSettingsChange({ includeMedicare: event.target.checked })} /></label>
        </div>
      </aside>
    </div>
  </section>
);

const SummaryPanel = ({ label, value }: { label: string; value: string }) => <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-foreground">{value}</p></div>;
const StatusBadge = ({ value, hasWorksheet }: { value: number; hasWorksheet: boolean }) => <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${!hasWorksheet ? "bg-muted text-muted-foreground" : value > 0 ? "bg-primary/10 text-primary" : value < 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{!hasWorksheet ? "No worksheet" : value > 0 ? "Positive" : value < 0 ? "Negative" : "Neutral"}</span>;

const PropertySheetField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
    {children}
  </div>
);

const LoanSplitsEditor = ({
  loanAmount,
  interestRate,
  loanSplits,
  nickname,
  highlightFirstSplit,
  firstSplitAmountRef,
  onFocusFirstSplit,
  onCreateFirstSplit,
  onChange,
}: {
  loanAmount: number;
  interestRate: number;
  loanSplits: LoanSplit[];
  nickname: string;
  highlightFirstSplit: boolean;
  firstSplitAmountRef: React.RefObject<HTMLInputElement>;
  onFocusFirstSplit: () => void;
  onCreateFirstSplit: () => void;
  onChange: (loanSplits: LoanSplit[]) => void;
}) => {
  const updateSplit = (index: number, patch: Partial<LoanSplit>) => {
    const next = loanSplits.map((split, splitIndex) => splitIndex === index ? { ...split, ...patch } : split);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Current Loan Balance</label>
        {loanSplits.length === 0 ? (
          <button
            onClick={onCreateFirstSplit}
            className="group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-accent/50 bg-accent/5 px-3 py-2.5 text-sm font-medium text-foreground transition-all hover:border-accent hover:bg-accent/10"
          >
            <span className="text-muted-foreground">$</span>
            <span>{loanAmount.toLocaleString()}</span>
            <span className="ml-auto text-[10px] font-normal text-accent group-hover:underline">Click to set up loan details →</span>
          </button>
        ) : (
          <button
            onClick={onFocusFirstSplit}
            className="group flex w-full cursor-pointer items-center gap-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-accent/50"
          >
            <span className="text-muted-foreground">$</span>
            <span>{loanAmount.toLocaleString()}</span>
            <span className="ml-auto text-[10px] text-muted-foreground transition-colors group-hover:text-accent">Edit in splits below ↓</span>
          </button>
        )}
        {loanSplits.length > 0 && <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-calculated from loan splits below</p>}
      </div>

      <div className="space-y-2 border-l-2 border-accent/20 pl-2">
        <div className="flex items-center justify-between">
          <label className="flex cursor-help items-center gap-1 text-xs font-medium text-muted-foreground">
            Loan Details <InfoIcon size={10} className="text-muted-foreground" />
          </label>
          <button
            onClick={() => onChange([...loanSplits, { id: crypto.randomUUID(), label: loanSplits.length === 0 ? nickname || "Split 1" : `Split ${loanSplits.length + 1}`, amount: 0, interestRate, loanTermYears: 30, interestOnlyPeriodYears: 0, offsetBalance: 0 }])}
            className="p-0.5 text-accent transition-colors hover:text-accent/80"
            aria-label="Add loan split"
          >
            <Plus size={16} />
          </button>
        </div>
        {loanSplits.length > 0 && (
          <div className="flex items-center gap-1 text-[8px] font-medium text-muted-foreground">
            <span className="min-w-0 flex-[2]">Label</span>
            <span className="min-w-0 flex-[2]">Amt ($)</span>
            <span className="min-w-0 flex-[1.2]">Rate (%)</span>
            <span className="min-w-0 flex-1">IO</span>
            <span className="min-w-0 flex-[1.2]">Term (yr)</span>
            <span className="min-w-0 flex-[2]">Offset ($)</span>
            <span className="w-4" />
          </div>
        )}
        {loanSplits.map((split, index) => (
          <div key={split.id} className="flex items-center gap-1">
            <Input value={split.label} onChange={(event) => updateSplit(index, { label: event.target.value })} className="h-8 min-w-0 flex-[2] px-1 text-[10px] font-medium" placeholder="Label" />
            <CurrencyEntryField value={split.amount || 0} onChange={(amount) => updateSplit(index, { amount })} compact inputRef={index === 0 ? firstSplitAmountRef : undefined} highlight={index === 0 && highlightFirstSplit} />
            <RateEntryField value={split.interestRate ?? interestRate} onChange={(rate) => updateSplit(index, { interestRate: rate })} compact />
            <Input type="number" min={0} max={99} value={split.interestOnlyPeriodYears ?? 0} onChange={(event) => updateSplit(index, { interestOnlyPeriodYears: Math.min(99, Math.max(0, Number(event.target.value) || 0)) })} className="h-8 min-w-0 flex-1 px-1 text-[10px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
            <Input type="number" min={1} value={split.loanTermYears ?? 30} onChange={(event) => updateSplit(index, { loanTermYears: Number(event.target.value) || 0 })} className="h-8 min-w-0 flex-[1.2] px-1 text-[10px]" />
            <CurrencyEntryField value={split.offsetBalance ?? 0} onChange={(offsetBalance) => updateSplit(index, { offsetBalance })} compact />
            <button onClick={() => onChange(loanSplits.filter((_, splitIndex) => splitIndex !== index))} className="w-4 shrink-0 text-muted-foreground transition-colors hover:text-destructive" aria-label="Remove loan split">
              <X size={10} />
            </button>
          </div>
        ))}
        {loanSplits.length > 0 && <p className="text-[10px] text-muted-foreground">Total: <span className="font-semibold text-foreground">{formatCurrency(loanAmount)}</span></p>}
      </div>
    </div>
  );
};

const ExpenseControl = ({
  label,
  value,
  frequency,
  onAmountChange,
  onFrequencyChange,
}: {
  label: string;
  value: number;
  frequency: ExpenseFrequency;
  onAmountChange: (value: number) => void;
  onFrequencyChange: (value: ExpenseFrequency) => void;
}) => (
  <div className="grid min-h-0 grid-cols-[minmax(5.75rem,0.95fr)_minmax(0,1fr)_5.75rem] items-center gap-2 border-b border-border/70 py-1.5 last:border-b-0">
    <p className="truncate text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="flex h-8 min-w-0 items-center rounded-md border border-input bg-background px-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <span className="text-xs font-bold text-accent">$</span>
        <input type="number" min="0" value={value === 0 ? "" : value} onChange={(event) => onAmountChange(Number(event.target.value) || 0)} className="min-w-0 flex-1 bg-transparent pl-1 text-sm font-bold text-foreground outline-none tabular-nums" />
      </div>
      <select value={frequency} onChange={(event) => onFrequencyChange(event.target.value as ExpenseFrequency)} className="h-8 min-w-0 rounded-md border border-input bg-background px-2 text-xs font-semibold capitalize text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <option value="annual">Annual</option>
        <option value="quarterly">Quarterly</option>
        <option value="monthly">Monthly</option>
      </select>
  </div>
);

const Info = ({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-3">
    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon size={14} /> {label}</div>
    <div className="text-sm font-semibold text-foreground">{value}</div>
  </div>
);

const EditableInfo = ({ icon: Icon, label, value, onChange, type = "text", suffix }: { icon: typeof Home; label: string; value: string | number; onChange: (value: string) => void; type?: string; suffix?: string }) => (
  <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
    <div className="flex min-w-[5.5rem] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"><Icon size={14} /> {label}</div>
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-8 border-0 bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
      {suffix ? <span className="text-sm font-semibold text-muted-foreground">{suffix}</span> : null}
    </div>
  </div>
);

const Metric = ({ icon: Icon, label, value, highlight = false, className = "" }: { icon: typeof Home; label: string; value: string; highlight?: boolean; className?: string }) => (
  <div className={`rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
  </div>
);

const SummaryMeasure = ({ icon: Icon, label, value, highlight = false }: { icon: typeof Home; label: string; value: string; highlight?: boolean }) => (
  <div className="min-w-0">
    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <Icon size={14} className="shrink-0 text-accent" />
      <span className="truncate">{label}</span>
    </div>
    <p className={`truncate text-base font-bold tabular-nums ${highlight ? "text-destructive" : "text-foreground"}`}>{value}</p>
  </div>
);

const CurrencyEntryField = ({ value, onChange, compact = false, inputRef, highlight = false }: { value: number; onChange: (value: number) => void; compact?: boolean; inputRef?: React.Ref<HTMLInputElement>; highlight?: boolean }) => (
  <div className={`flex items-center gap-1 rounded-md border bg-background ring-offset-background transition-all focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${compact ? "h-8 min-w-0 flex-[2] px-1" : "h-10 px-3"} ${highlight ? "border-destructive ring-2 ring-destructive/30" : "border-input"}`}>
    <span className="text-sm font-medium text-muted-foreground">$</span>
    <input
      ref={inputRef}
      inputMode="numeric"
      value={value ? value.toLocaleString() : ""}
      onChange={(event) => onChange(parseCurrencyValue(event.target.value))}
      className={`min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none tabular-nums ${compact ? "text-[10px]" : "text-sm"}`}
    />
  </div>
);

const RateEntryField = ({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) => {
  const [raw, setRaw] = useState(value ? value.toFixed(2) : "");

  useEffect(() => {
    setRaw(value ? value.toFixed(2) : "");
  }, [value]);

  return (
    <div className={`flex items-center gap-2 rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${compact ? "h-8 min-w-0 flex-[1.2] px-1" : "h-10 px-3"}`}>
      <input
        inputMode="decimal"
        value={raw}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "" || /^[0-9]*\.?[0-9]{0,2}$/.test(next)) {
            setRaw(next);
            onChange(next === "" ? 0 : Number(next) || 0);
          }
        }}
        onBlur={() => setRaw(raw ? (Number(raw) || 0).toFixed(2) : "")}
        className={`min-w-0 flex-1 bg-transparent font-semibold text-foreground outline-none tabular-nums ${compact ? "text-[10px]" : "text-sm"}`}
      />
      <span className={`${compact ? "text-[10px]" : "text-sm"} font-semibold text-muted-foreground`}>%</span>
    </div>
  );
};

const SummaryRow = ({ label, values, total }: { label: string; values: number[]; total: number }) => (
  <tr className="border-t-2 border-border bg-accent/10 font-bold">
    <td className="sticky left-0 z-20 bg-card px-2 py-2 text-foreground shadow-[6px_0_12px_-12px_hsl(var(--foreground))] sm:px-3 lg:px-4">{label}</td>
    {values.map((value, i) => <td key={i} className="px-1 py-2 text-right tabular-nums text-foreground lg:px-1.5">{formatCurrency(value)}</td>)}
    <td className="sticky right-[4.5rem] z-20 bg-card px-2 py-2 text-right tabular-nums text-foreground shadow-[-6px_0_12px_-12px_hsl(var(--foreground))] lg:right-[5.4%]">{formatCurrency(total)}</td>
    <td className="sticky right-0 z-20 bg-card px-2 py-2" />
  </tr>
);

export default CashflowTracker;