import { useEffect, useMemo, useState } from "react";
import { Banknote, Building2, CalendarDays, Download, FolderOpen, Home, LayoutDashboard, Link2, Percent, Plus, RefreshCw, Save, Trash2, TrendingDown, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ScenarioContextBanner from "@/components/ScenarioContextBanner";
import UserMenu from "@/components/UserMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import AddressSearchInput from "@/components/AddressSearchInput";
import type { ExistingProperty } from "@/types/property";
import { defaultLoanDetails, defaultPurchaseDetails, defaultRentalDetails } from "@/types/property";
import { getActiveScenario, getScenario } from "@/lib/scenarioManager";
import { getActiveCashflowContext, getCashflowForProperty, saveCashflowForProperty, setActiveCashflowContext, type CashflowPropertyType } from "@/lib/cashflowManager";

const months = ["Jul-26", "Aug-26", "Sep-26", "Oct-26", "Nov-26", "Dec-26", "Jan-27", "Feb-27", "Mar-27", "Apr-27", "May-27", "Jun-27"];

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
  manager: "",
};

type CouncilRatesState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type InsuranceState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type LandTaxState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type WaterState = { amount: number; frequency: "annual" | "quarterly" | "monthly" };
type CashflowState = { rows: CashflowRow[]; propertyDetails: typeof property; councilRates: CouncilRatesState; insurance: InsuranceState; landTax: LandTaxState; water: WaterState; activeMonth: number; templateVersion: number };
type SavedCashflowScenario = { id: string; name: string; savedAt: string; state: CashflowState };
type PortfolioPropertyOption = { id: string; label: string; address: string; owner: string; bank: string; weeklyRent: number; interestRate: number; loanAmount: number; propertyType: CashflowPropertyType };

const CASHFLOW_SCENARIOS_KEY = "saved-cashflow-scenarios";
const ACTIVE_CASHFLOW_SCENARIO_KEY = "active-cashflow-scenario-id";
const CASHFLOW_WORKING_STATE_KEY = "cashflow-working-state";
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
      interestRate: item.loan?.interestRate || 0,
      loanAmount: item.loanSplits?.length ? item.loanSplits.reduce((sum, split) => sum + (split.amount || 0), 0) : item.loanBalance || 0,
      propertyType: item.id === "ppor" ? "ppor" : item.ownership === "trust" ? "smsf" : "investment",
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

const formatCurrency = (value: number) => value === 0 ? "$0" : value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;

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
  const [portfolioProperties] = useState<PortfolioPropertyOption[]>(getPortfolioPropertyOptions);
  const [cashflowContext, setCashflowContextState] = useState(() => getActiveCashflowContext());
  const [financialYear, setFinancialYear] = useState(() => getActiveCashflowContext()?.financialYear || "FY2027");
  const [showLinkExisting, setShowLinkExisting] = useState(false);
  const activeScenario = savedScenarios.find((scenario) => scenario.id === activeScenarioId);
  const linkedRecord = cashflowContext ? getCashflowForProperty<CashflowState>(cashflowContext) : undefined;
  const linkedScenario = cashflowContext ? getScenario(cashflowContext.scenarioId) || getActiveScenario() : getActiveScenario();

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
    const state = currentCashflowState();
    localStorage.setItem(CASHFLOW_WORKING_STATE_KEY, JSON.stringify(state));

    if (!activeScenarioId) return;

    setSavedScenarios((current) => {
      const nextScenarios = current.map((scenario) => scenario.id === activeScenarioId ? { ...scenario, state } : scenario);
      localStorage.setItem(CASHFLOW_SCENARIOS_KEY, JSON.stringify(nextScenarios));
      return nextScenarios;
    });
  }, [rows, propertyDetails, councilRates, insurance, landTax, water, activeMonth, activeScenarioId]);

  const totals = useMemo(() => {
    const income = rows.filter((r) => r.type === "income").reduce((sum, row) => sum + row.values.reduce((a, b) => a + b, 0), 0);
    const expensesByMonth = months.map((_, i) => rows.filter((r) => r.type === "expense").reduce((sum, row) => sum + row.values[i], 0));
    const incomeByMonth = rows.find((r) => r.type === "income")?.values || [];
    const expenses = expensesByMonth.reduce((a, b) => a + b, 0);
    return { income, expenses, net: income - expenses, holdingCost: Math.max(expenses - income, 0), incomeByMonth, expensesByMonth };
  }, [rows]);

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
  };

  const updateLoanAmount = (loanAmount: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(loanAmount, current.interestRate);
      return { ...current, loanAmount };
    });
  };

  const updateInterestRate = (interestRate: number) => {
    setPropertyDetails((current) => {
      updateInterestRow(current.loanAmount, interestRate);
      return { ...current, interestRate };
    });
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
    const scenario = getActiveScenario();
    if (scenario) {
      const nextContext = { clientId: scenario.clientId, scenarioId: scenario.id, propertyId: selected.id, propertyType: selected.propertyType, financialYear };
      setActiveCashflowContext(nextContext);
      setCashflowContextState(nextContext);
      const record = getCashflowForProperty<CashflowState>(nextContext);
      if (record?.state) {
        const normalized = normalizeCashflowState(record.state);
        setRows(normalized.rows);
        setPropertyDetails(normalized.propertyDetails);
        setCouncilRates(normalized.councilRates);
        setInsurance(normalized.insurance);
        setLandTax(normalized.landTax);
        setWater(normalized.water);
        setActiveMonth(normalized.activeMonth);
        toast.success(`Loaded ${selected.label} cashflow`);
        return;
      }
    }
    setPropertyDetails((current) => ({
      ...current,
      nickname: selected.label,
      address: selected.address,
      owner: selected.owner,
      bank: selected.bank,
      weeklyRent: selected.weeklyRent,
      interestRate: selected.interestRate,
      loanAmount: selected.loanAmount,
    }));
    toast.success(`Linked ${selected.label}`);
  };

  const addNewPortfolioProperty = () => {
    const propertyId = crypto.randomUUID();
    const newProperty: ExistingProperty = {
      id: propertyId,
      nickname: propertyDetails.nickname || "New property",
      address: propertyDetails.address,
      estimatedValue: 0,
      loanBalance: propertyDetails.loanAmount || 0,
      earmarked: false,
      sellInYears: 0,
      ownership: "personal",
      investmentType: "house",
      loan: { ...defaultLoanDetails, lenderName: propertyDetails.bank, interestRate: propertyDetails.interestRate },
      rental: { ...defaultRentalDetails, weeklyRent: propertyDetails.weeklyRent },
      purchase: { ...defaultPurchaseDetails },
    };
    const existing = JSON.parse(localStorage.getItem("portfolio-properties") || "[]") as ExistingProperty[];
    localStorage.setItem("portfolio-properties", JSON.stringify([...existing, newProperty]));
    const scenario = getActiveScenario();
    if (scenario) {
      const nextContext = { clientId: scenario.clientId, scenarioId: scenario.id, propertyId, propertyType: "investment" as CashflowPropertyType, financialYear };
      setActiveCashflowContext(nextContext);
      setCashflowContextState(nextContext);
    }
    setPropertyDetails((current) => ({ ...current, nickname: newProperty.nickname }));
    toast.success("Added new portfolio property");
  };

  const currentCashflowState = (): CashflowState => ({ rows, propertyDetails, councilRates, insurance, landTax, water, activeMonth, templateVersion: CASHFLOW_TEMPLATE_VERSION });

  const handlePrototypeUpload = (files: FileList | null) => {
    if (!files?.length) return;
    toast.info(`${files.length} file${files.length === 1 ? "" : "s"} queued. Receipt scanning will populate totals in a future release.`);
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

  const saveAsNewYear = () => {
    if (!cashflowContext) return updateActiveCashflowScenario();
    const nextYear = window.prompt("Financial year", financialYear === "FY2027" ? "FY2028" : financialYear);
    if (!nextYear) return;
    const nextContext = { ...cashflowContext, financialYear: nextYear };
    const saved = saveCashflowForProperty(nextContext, currentCashflowState(), `${propertyDetails.nickname || propertyDetails.address || "Property"} ${nextYear}`);
    setFinancialYear(nextYear);
    setCashflowContextState(saved);
    toast.success(`Saved as ${nextYear}`);
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
      ["Detailed Breakdown", ...months, "Subtotal"],
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
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex min-h-11 items-center gap-1.5 rounded-lg border border-accent/20 px-3 text-xs font-medium text-accent/70 transition-all hover:bg-accent/10 hover:text-accent" aria-label="Cashflow scenarios">
                    <FolderOpen size={14} /> Scenarios
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Cashflow scenarios</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    {activeScenario && (
                      <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/5 p-2.5">
                        <span className="text-xs text-muted-foreground">Active:</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{activeScenario.name}</span>
                        <button onClick={updateActiveCashflowScenario} className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"><RefreshCw size={12} /> Update</button>
                      </div>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input value={saveName} onChange={(event) => setSaveName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveCashflowScenario()} placeholder="Scenario name..." className="h-11" />
                      <button onClick={saveCashflowScenario} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"><Save size={16} /> Save</button>
                    </div>
                    {savedScenarios.length > 0 ? (
                      <div className="space-y-2 border-t border-border pt-3">
                        <p className="text-sm font-medium text-foreground">Saved scenarios</p>
                        <div className="max-h-60 space-y-2 overflow-y-auto scrollbar-thin">
                          {savedScenarios.map((scenario) => (
                            <div key={scenario.id} className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${scenario.id === activeScenarioId ? "border-accent bg-accent/5" : "border-border bg-muted/50"}`}>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{scenario.name}</p>
                                <p className="text-xs text-muted-foreground">{new Date(scenario.savedAt).toLocaleDateString()} {new Date(scenario.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                              <button onClick={() => loadCashflowScenario(scenario)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Download size={16} /> Load</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">No cashflow scenarios saved yet.</p>}
                  </div>
                </DialogContent>
              </Dialog>
              <UserMenu />
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="mb-1 text-xl font-bold md:mb-3 md:text-5xl">Cashflow Tracker</h1>
              <p className="max-w-2xl text-sm font-light text-accent md:text-xl">Track month-by-month rental income, deductible expenses and net position.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:items-center">
              <label className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-5 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition-colors hover:bg-accent/90">
                <Upload size={18} /> Upload invoices / receipts
                <input type="file" multiple accept="image/*,.pdf,.csv,.xlsx,.xls" className="sr-only" onChange={(event) => handlePrototypeUpload(event.target.files)} />
              </label>
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
                Period ended 30th June 2027
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        <div className="mb-4">
          <ScenarioContextBanner compact />
        </div>
        <section className="mb-4 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Linked property</p>
              <h2 className="truncate text-lg font-bold text-foreground">{propertyDetails.nickname || propertyDetails.address || "Choose a property"}</h2>
              <p className="text-sm text-muted-foreground">
                {linkedScenario?.name || "No active scenario"} · {cashflowContext?.propertyType || "property"} · {financialYear}
                {linkedRecord?.lastEditedByName && ` · Last updated by ${linkedRecord.lastEditedByName}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={financialYear}
                onChange={(event) => {
                  const nextYear = event.target.value;
                  setFinancialYear(nextYear);
                  if (cashflowContext) {
                    const nextContext = { ...cashflowContext, financialYear: nextYear };
                    setActiveCashflowContext(nextContext);
                    setCashflowContextState(nextContext);
                  }
                }}
                className="min-h-11 rounded-lg border border-input bg-background px-3 text-sm font-semibold text-foreground"
              >
                {['FY2027', 'FY2028', 'FY2029', 'FY2030'].map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <button onClick={updateActiveCashflowScenario} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"><Save size={16} /> Save cashflow</button>
              <button onClick={saveAsNewYear} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted">Save as new year</button>
            </div>
          </div>
        </section>
        <section className="grid items-start gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-3 shadow-sm md:col-span-3 xl:col-span-4">
            <div className="mb-1.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Home size={16} /> Property details</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowLinkExisting((current) => !current)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Link2 size={16} /> Link existing property</button>
                <button onClick={addNewPortfolioProperty} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"><Plus size={16} /> Add new property</button>
              </div>
            </div>
            {showLinkExisting && (
              <select onChange={(event) => linkPortfolioProperty(event.target.value)} defaultValue="" className="mb-3 h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <option value="" disabled>Select existing portfolio property</option>
                {portfolioProperties.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            )}
            <div className="grid gap-1.5 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-1.5">
                <Input value={propertyDetails.nickname} onChange={(event) => setPropertyDetails((current) => ({ ...current, nickname: event.target.value }))} placeholder="Property nickname" className="h-9 text-sm font-bold" />
                <AddressSearchInput value={propertyDetails.address} onChange={(value) => setPropertyDetails((current) => ({ ...current, address: value }))} placeholder="Optional address search" className="h-9 text-sm font-semibold" />
                <Input value={propertyDetails.owner} onChange={(event) => setPropertyDetails((current) => ({ ...current, owner: event.target.value }))} className="h-9 text-sm font-semibold" />
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                <EditableInfo icon={Building2} label="Manager" value={propertyDetails.manager} onChange={(value) => setPropertyDetails((current) => ({ ...current, manager: value }))} />
                <EditableInfo icon={Banknote} label="Bank" value={propertyDetails.bank} onChange={(value) => setPropertyDetails((current) => ({ ...current, bank: value }))} />
              </div>
            </div>
          </div>
          <Metric label="Rental income" value={formatCurrency(totals.income)} icon={Banknote} />
          <Metric label="Total expenses" value={formatCurrency(totals.expenses)} icon={TrendingDown} />
          <Metric label="Cashflow over the year" value={formatCurrency(totals.holdingCost)} icon={CalendarDays} highlight={totals.holdingCost > 0} />
          <EditableMetric label="Total loan amount" value={propertyDetails.loanAmount} icon={Banknote} onChange={updateLoanAmount} />
          <EditableMetric label="Interest rate" value={propertyDetails.interestRate} icon={Percent} suffix="%" step="0.01" onChange={updateInterestRate} />
          <EditableMetric label="Weekly rent" value={propertyDetails.weeklyRent} icon={Home} onChange={updatePropertyWeeklyRent} />
          <ExpenseControl label="Council rates" value={councilRates.amount} frequency={councilRates.frequency} onAmountChange={(amount) => updateCouncilRates({ amount })} onFrequencyChange={(frequency) => updateCouncilRates({ frequency })} />
          <ExpenseControl label="Insurance" value={insurance.amount} frequency={insurance.frequency} onAmountChange={(amount) => updateInsurance({ amount })} onFrequencyChange={(frequency) => updateInsurance({ frequency })} />
          <ExpenseControl label="Land tax" value={landTax.amount} frequency={landTax.frequency} onAmountChange={(amount) => updateLandTax({ amount })} onFrequencyChange={(frequency) => updateLandTax({ frequency })} />
          <ExpenseControl label="Water charges" value={water.amount} frequency={water.frequency} onAmountChange={(amount) => updateWater({ amount })} onFrequencyChange={(frequency) => updateWater({ frequency })} />
        </section>

        <section className="mt-6 rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Monthly cashflow worksheet</h2>
              <p className="text-sm text-muted-foreground">Edit weekly rents, row labels and monthly values directly in the worksheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={exportCashflowSummary} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"><Download size={16} /> Export summary</button>
              <button onClick={() => addRow("income")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Income row</button>
              <button onClick={() => addRow("expense")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"><Plus size={16} /> Expense row</button>
              <div className="text-sm font-semibold text-accent">Net YTD {formatCurrency(totals.net)}</div>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[1400px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                   <th className="sticky left-0 z-20 min-w-72 bg-muted px-4 py-3 text-left font-bold text-foreground shadow-sm">Cashflow item</th>
                  {months.map((month, i) => (
                    <th key={month} className="px-3 py-3 text-right">
                      <button onClick={() => setActiveMonth(i)} className={`min-h-11 rounded-lg px-3 text-sm font-bold transition-colors ${activeMonth === i ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-accent/10"}`}>
                        {month}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-bold text-foreground">Total</th>
                  <th className="px-3 py-3 text-right font-bold text-foreground">Remove</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70 hover:bg-muted/30">
                    <td className="sticky left-0 z-20 min-w-72 bg-card px-4 py-3 font-medium text-foreground shadow-sm">
                      <Input value={row.label} onChange={(event) => updateRow(row.id, { label: event.target.value })} className="h-9 min-w-56 bg-card font-semibold" />
                    </td>
                    {row.values.map((value, i) => (
                      <td key={i} className={`px-3 py-3 text-right tabular-nums ${activeMonth === i ? "bg-accent/10 font-bold text-foreground" : "text-muted-foreground"}`}>
                        <Input type="number" min="0" value={value || ""} onChange={(event) => updateValue(row.id, i, Number(event.target.value) || 0)} className="ml-auto h-9 w-24 text-right tabular-nums" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">{formatCurrency(row.values.reduce((a, b) => a + b, 0))}</td>
                    <td className="px-3 py-3 text-right">
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

      </main>
    </div>
  );
};

type ExpenseFrequency = "annual" | "quarterly" | "monthly";

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
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
      <Input type="number" min="0" value={value === 0 ? "" : value} onChange={(event) => onAmountChange(Number(event.target.value) || 0)} className="h-11 text-lg font-bold tabular-nums" />
      <select value={frequency} onChange={(event) => onFrequencyChange(event.target.value as ExpenseFrequency)} className="h-11 rounded-md border border-input bg-background px-3 text-sm font-semibold capitalize text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <option value="annual">Annual</option>
        <option value="quarterly">Quarterly</option>
        <option value="monthly">Monthly</option>
      </select>
    </div>
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

const EditableMetric = ({ icon: Icon, label, value, onChange, suffix, step = "1" }: { icon: typeof Home; label: string; value: number; onChange: (value: number) => void; suffix?: string; step?: string }) => (
  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={22} /></div>
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="mt-1 flex items-center gap-2">
      <Input type="number" min="0" step={step} value={value === 0 ? "" : value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="h-11 text-2xl font-bold tabular-nums" />
      {suffix ? <span className="text-xl font-bold text-muted-foreground">{suffix}</span> : null}
    </div>
  </div>
);

const SummaryRow = ({ label, values, total }: { label: string; values: number[]; total: number }) => (
  <tr className="border-t-2 border-border bg-accent/10 font-bold">
    <td className="sticky left-0 z-20 min-w-72 bg-card px-4 py-3 text-foreground shadow-sm">{label}</td>
    {values.map((value, i) => <td key={i} className="px-3 py-3 text-right tabular-nums text-foreground">{formatCurrency(value)}</td>)}
    <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(total)}</td>
    <td className="px-3 py-3" />
  </tr>
);

export default CashflowTracker;