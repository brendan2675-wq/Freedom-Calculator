export interface ActingAsContext {
  clientId: string;
  scenarioId: string;
  clientName: string;
  scenarioName: string;
}

const KEY = "adviser-acting-as";

export function getActingAs(): ActingAsContext | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActingAsContext) : null;
  } catch {
    return null;
  }
}

export function setActingAs(ctx: ActingAsContext) {
  localStorage.setItem(KEY, JSON.stringify(ctx));
  window.dispatchEvent(new Event("acting-as-changed"));
}

export function clearActingAs() {
  localStorage.removeItem(KEY);
  localStorage.removeItem("active-scenario-id");
  window.dispatchEvent(new Event("acting-as-changed"));
}

const AdviserActingBanner = () => null;

export default AdviserActingBanner;
