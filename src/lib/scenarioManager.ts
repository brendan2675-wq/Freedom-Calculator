/**
 * Scenario seam — saved scenarios + sharing metadata + the live working state.
 *
 * TODO(backend): swap the localStorage internals below for real API calls:
 *   - getSavedScenarios / getScenario   →  GET /scenarios, GET /scenarios/:id
 *   - saveScenario                      →  POST /scenarios
 *   - updateScenario / setScenarioMeta  →  PATCH /scenarios/:id
 *   - deleteScenario                    →  DELETE /scenarios/:id
 *   - buildScenarioFromStorage          →  GET /scenarios/current  (working state)
 *   - applyScenarioToStorage            →  PATCH /scenarios/current
 *
 * Sharing with agents (sharedAgentIds) should be enforced server-side via a
 * `scenario_shares` table — the client merely displays/edits the list.
 * The `?readonly=1` URL flag is a UI hint only; trust the server's permission
 * check, not the URL.
 *
 * Keep public signatures unchanged. See src/lib/api.ts and
 * BACKEND_INTEGRATION.md.
 */
import type { ExistingProperty, FutureProperty, SaleCosts } from "@/types/property";
import { getRole, getUser } from "@/lib/auth";
import { getClient } from "@/lib/clients";

// Migration: older scenarios saved saleCosts with incomeTaxRate: 0 (tax-free
// threshold) which is almost never the user's intent. Promote any zero/missing
// rate to the top marginal default (0.47 = 45% + 2% ML) — but ONLY when the
// user has not explicitly chosen a bracket (taxRateUserSet flag absent).
function migrateSaleCosts<T extends { saleCosts?: SaleCosts }>(p: T): T {
  const sc = p?.saleCosts as (SaleCosts & { taxRateUserSet?: boolean }) | undefined;
  if (sc && !sc.taxRateUserSet && (!sc.incomeTaxRate || sc.incomeTaxRate === 0)) {
    return { ...p, saleCosts: { ...sc, incomeTaxRate: 0.47 } };
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
    ppor: migrateSaleCosts(safeJson<ExistingProperty>("portfolio-ppor", blankPpor)),
    existingProperties: safeJson<ExistingProperty[]>("portfolio-properties", []).map(migrateSaleCosts),
    futureProperties: safeJson<FutureProperty[]>("portfolio-future-properties", []).map(migrateSaleCosts),
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

export type ScenarioType = "individual" | "smsf";

export interface SavedScenario {
  id: string;
  name: string;
  savedAt: string;
  state: ScenarioState;
  clientId?: string;
  ownerId?: string; // user id of creator (adviser or client)
  ownerRole?: "client" | "adviser";
  sharedAgentIds?: string[];
  type?: ScenarioType;
  lastEditedById?: string;
  lastEditedByName?: string;
  lastEditedByRole?: "client" | "adviser";
  lastOpenedAt?: string;
  version?: number;
}

const SCENARIOS_KEY = "saved-scenarios";
const ACTIVE_SCENARIO_KEY = "active-scenario-id";
const LOADED_SCENARIO_VERSION_KEY = "active-scenario-loaded-version";

const stampEditMeta = () => {
  const user = getUser();
  const role = getRole();
  return {
    lastEditedById: user?.id,
    lastEditedByName: user?.name || (role === "adviser" ? "Adviser" : role === "client" ? "Client" : undefined),
    lastEditedByRole: role === "adviser" || role === "client" ? role : undefined,
  } satisfies Partial<SavedScenario>;
};

const normalizeScenario = (scenario: SavedScenario): SavedScenario => ({
  ...scenario,
  sharedAgentIds: scenario.sharedAgentIds || [],
  type: scenario.type || "individual",
  version: scenario.version || 1,
  lastEditedByRole: scenario.lastEditedByRole || scenario.ownerRole,
  lastEditedById: scenario.lastEditedById || scenario.ownerId,
});

export function getSavedScenarios(): SavedScenario[] {
  try {
    const stored = localStorage.getItem(SCENARIOS_KEY);
    return stored ? (JSON.parse(stored) as SavedScenario[]).map(normalizeScenario) : [];
  } catch {
    return [];
  }
}

export function saveScenario(
  name: string,
  state: ScenarioState,
  meta?: Partial<Pick<SavedScenario, "clientId" | "ownerId" | "ownerRole" | "sharedAgentIds" | "type" | "lastEditedById" | "lastEditedByName" | "lastEditedByRole">>,
): SavedScenario {
  const scenarios = getSavedScenarios();
  const editMeta = stampEditMeta();
  const scenario: SavedScenario = {
    id: crypto.randomUUID(),
    name,
    savedAt: new Date().toISOString(),
    state,
    sharedAgentIds: [],
    type: "individual",
    version: 1,
    ...editMeta,
    ...meta,
  };
  scenarios.push(scenario);
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  return scenario;
}

export function updateScenario(
  id: string,
  state: ScenarioState,
  meta?: Partial<Pick<SavedScenario, "clientId" | "ownerId" | "ownerRole" | "sharedAgentIds" | "type" | "name" | "lastEditedById" | "lastEditedByName" | "lastEditedByRole" | "lastOpenedAt" | "version">>,
): SavedScenario | null {
  const scenarios = getSavedScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const editMeta = stampEditMeta();
  scenarios[idx] = { ...scenarios[idx], ...editMeta, ...meta, savedAt: new Date().toISOString(), version: meta?.version ?? ((scenarios[idx].version || 1) + 1), state };
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  return scenarios[idx];
}

export function setScenarioMeta(
  id: string,
  meta: Partial<Pick<SavedScenario, "clientId" | "ownerId" | "ownerRole" | "sharedAgentIds" | "type" | "name" | "lastEditedById" | "lastEditedByName" | "lastEditedByRole" | "lastOpenedAt" | "version">>,
): SavedScenario | null {
  const scenarios = getSavedScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  const clientChanged = Object.prototype.hasOwnProperty.call(meta, "clientId");
  const clientName = meta.clientId ? getClient(meta.clientId)?.name : undefined;
  scenarios[idx] = {
    ...scenarios[idx],
    ...meta,
    state: clientChanged
      ? { ...scenarios[idx].state, clientName: clientName || "Unassigned client" }
      : scenarios[idx].state,
  };
  localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  return scenarios[idx];
}

export function getScenario(id: string): SavedScenario | undefined {
  return getSavedScenarios().find((s) => s.id === id);
}

export function getActiveScenario(): SavedScenario | null {
  const id = localStorage.getItem(ACTIVE_SCENARIO_KEY);
  return id ? getScenario(id) || null : null;
}

export function setActiveScenario(id: string) {
  const scenario = getScenario(id);
  if (!scenario) return null;
  localStorage.setItem(ACTIVE_SCENARIO_KEY, id);
  localStorage.setItem(LOADED_SCENARIO_VERSION_KEY, String(scenario.version || 1));
  setScenarioMeta(id, { lastOpenedAt: new Date().toISOString() });
  window.dispatchEvent(new Event("active-scenario-changed"));
  return scenario;
}

export function loadScenarioToWorkingState(scenario: SavedScenario) {
  applyScenarioToStorage(scenario.state);
  setActiveScenario(scenario.id);
}

export function saveActiveScenarioFromWorkingState(meta?: Partial<SavedScenario>): { scenario: SavedScenario | null; conflict: boolean } {
  const activeId = localStorage.getItem(ACTIVE_SCENARIO_KEY);
  if (!activeId) return { scenario: null, conflict: false };
  const current = getScenario(activeId);
  if (!current) return { scenario: null, conflict: false };
  const loadedVersion = parseInt(localStorage.getItem(LOADED_SCENARIO_VERSION_KEY) || String(current.version || 1), 10);
  const conflict = (current.version || 1) > loadedVersion;
  const updated = updateScenario(activeId, buildScenarioFromStorage(), meta);
  if (updated) {
    localStorage.setItem(LOADED_SCENARIO_VERSION_KEY, String(updated.version || 1));
    window.dispatchEvent(new Event("active-scenario-changed"));
  }
  return { scenario: updated, conflict };
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
    const parsed = JSON.parse(json) as ScenarioState;
    return {
      ...parsed,
      ppor: parsed.ppor ? migrateSaleCosts(parsed.ppor) : parsed.ppor,
      existingProperties: (parsed.existingProperties || []).map(migrateSaleCosts),
      futureProperties: (parsed.futureProperties || []).map(migrateSaleCosts),
    };
  } catch {
    return null;
  }
}
