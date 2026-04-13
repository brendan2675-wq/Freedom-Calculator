import type { ExistingProperty, FutureProperty } from "@/types/property";

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
