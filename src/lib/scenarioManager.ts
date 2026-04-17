import type { ExistingProperty, FutureProperty, SaleCosts } from "@/types/property";

// Migration: older scenarios saved saleCosts with incomeTaxRate: 0 (tax-free
// threshold) which is almost never the user's intent. Promote any zero/missing
// rate to the top marginal default (0.47 = 45% + 2% ML) to match new defaults.
function migrateSaleCosts<T extends { saleCosts?: SaleCosts }>(p: T): T {
  if (p?.saleCosts && (!p.saleCosts.incomeTaxRate || p.saleCosts.incomeTaxRate === 0)) {
    return { ...p, saleCosts: { ...p.saleCosts, incomeTaxRate: 0.47 } };
  }
  return p;
}

export interface ScenarioState {
  clientName: string;
  interestRate: number;
  targetMonth: number;
  targetYear: number;
  growthRate: number;
  pporSuburb: string;
  ppor: ExistingProperty;
  existingProperties: ExistingProperty[];
  futureProperties: FutureProperty[];
  pporStartingBalance?: number;
}

// Build a complete scenario from localStorage so any page can save without
// owning the React state for every input. Falls back to safe defaults.
export function buildScenarioFromStorage(): ScenarioState {
  const safeJson = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const blankPpor = {
    id: "ppor",
    nickname: "",
    estimatedValue: 0,
    loanBalance: 0,
    earmarked: false,
    sellInYears: 0,
    ownership: "personal" as const,
    investmentType: "house" as const,
    loan: { interestRate: 6.5, repaymentType: "principal-and-interest" as const, ioYears: 0, loanTermYears: 30 },
    rental: { weeklyRent: 0 },
    purchase: { purchaseDate: "", settlementDate: "", purchasePrice: 0, deposit: 0, stampDuty: 0, otherCosts: 0, state: "NSW" as const },
  } as unknown as ExistingProperty;

  return {
    clientName: localStorage.getItem("client-name") || "Client Name",
    interestRate: parseFloat(localStorage.getItem("global-interest-rate") || "6.5") || 6.5,
    targetMonth: parseInt(localStorage.getItem("target-month") || "0", 10) || 0,
    targetYear: parseInt(localStorage.getItem("target-year") || String(new Date().getFullYear() + 10), 10) || new Date().getFullYear() + 10,
    growthRate: parseFloat(localStorage.getItem("growth-rate") || "6.5") || 6.5,
    pporSuburb: localStorage.getItem("ppor-suburb") || "",
    ppor: safeJson<ExistingProperty>("portfolio-ppor", blankPpor),
    existingProperties: safeJson<ExistingProperty[]>("portfolio-properties", []),
    futureProperties: safeJson<FutureProperty[]>("portfolio-future-properties", []),
    pporStartingBalance: parseInt(localStorage.getItem("ppor-starting-balance") || "0", 10) || undefined,
  };
}

// Apply a scenario to localStorage and reload so every page picks up the new state.
export function applyScenarioToStorage(state: ScenarioState) {
  localStorage.setItem("client-name", state.clientName || "Client Name");
  localStorage.setItem("ppor-suburb", state.pporSuburb || "");
  localStorage.setItem("global-interest-rate", String(state.interestRate));
  localStorage.setItem("target-month", String(state.targetMonth));
  localStorage.setItem("target-year", String(state.targetYear));
  localStorage.setItem("growth-rate", String(state.growthRate));
  localStorage.setItem("portfolio-ppor", JSON.stringify(state.ppor));
  localStorage.setItem("portfolio-properties", JSON.stringify(state.existingProperties));
  localStorage.setItem("portfolio-future-properties", JSON.stringify(state.futureProperties));
  if (state.pporStartingBalance) {
    localStorage.setItem("ppor-starting-balance", String(state.pporStartingBalance));
  } else {
    localStorage.removeItem("ppor-starting-balance");
  }
}

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  state: ScenarioState;
}

const SCENARIOS_KEY = "saved-scenarios";

export function getSavedScenarios(): SavedScenario[] {
  try {
    const stored = localStorage.getItem(SCENARIOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveScenario(name: string, state: ScenarioState): SavedScenario {
  const scenarios = getSavedScenarios();
  const scenario: SavedScenario = {
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    state,
  };
  scenarios.push(scenario);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  return scenario;
}

export function updateScenario(id: string, state: ScenarioState): SavedScenario | null {
  const scenarios = getSavedScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  scenarios[idx] = { ...scenarios[idx], savedAt: new Date().toISOString(), state };
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  return scenarios[idx];
}

export function deleteScenario(id: string) {
  const scenarios = getSavedScenarios().filter((s) => s.id !== id);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
}

export function encodeStateToUrl(state: ScenarioState): string {
  const json = JSON.stringify(state);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.searchParams.set("scenario", encoded);
  return url.toString();
}

export function decodeStateFromUrl(): ScenarioState | null {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("scenario");
  if (!encoded) return null;
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
