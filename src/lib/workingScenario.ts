/**
 * Working Scenario seam — the live dashboard state that the user is editing
 * right now (PPOR, properties, target year, growth rate, etc.).
 *
 * Today this is spread across ~10 `portfolio-*` / `*-rate` / `target-*` keys
 * in localStorage. Components currently read those keys directly, which is
 * fine for the prototype but makes a cloud migration painful.
 *
 * Going forward, ALL reads/writes of the live working scenario should go
 * through `readWorkingScenario()` and `writeWorkingScenario()`. The backend
 * developer only has to swap the body of these two functions to point at
 * `GET /scenarios/current` and `PATCH /scenarios/current` (or equivalent).
 *
 * NOTE: existing components have not yet been refactored to use this seam —
 * that's a follow-up cleanup. New code SHOULD use it from day one.
 */
import { buildScenarioFromStorage, applyScenarioToStorage, type ScenarioState } from "./scenarioManager";

/**
 * Read the user's current in-progress scenario.
 * TODO(backend): replace with `await apiFetch<ScenarioState>("/scenarios/current")`.
 */
export async function readWorkingScenario(): Promise<ScenarioState> {
  return buildScenarioFromStorage();
}

/** Synchronous variant for legacy call sites that can't easily await. */
export function readWorkingScenarioSync(): ScenarioState {
  return buildScenarioFromStorage();
}

/**
 * Persist the user's current in-progress scenario.
 * TODO(backend): replace with
 *   `await apiFetch("/scenarios/current", { method: "PATCH", body: state })`.
 */
export async function writeWorkingScenario(state: ScenarioState): Promise<void> {
  applyScenarioToStorage(state);
}

export function writeWorkingScenarioSync(state: ScenarioState): void {
  applyScenarioToStorage(state);
}

/**
 * Keys that are SAFE to keep in localStorage even after the cloud migration.
 * These are pure UI/onboarding flags — losing them only re-shows a toast.
 * Anything not in this list should be moved to the API.
 */
export const UI_ONLY_LOCALSTORAGE_KEYS = [
  "disclaimer-shown",
  "welcome-dismissed",
  "tip-shown",
] as const;
