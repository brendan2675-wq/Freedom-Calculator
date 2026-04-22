import { getRole, getUser } from "@/lib/auth";
import { getScenario, type SavedScenario } from "@/lib/scenarioManager";

export type CashflowPropertyType = "ppor" | "investment" | "smsf" | "future";

export interface CashflowContext {
  clientId?: string;
  scenarioId: string;
  propertyId: string;
  propertyType: CashflowPropertyType;
  financialYear: string;
}

export interface CashflowRecord<TState = unknown> extends CashflowContext {
  id: string;
  name: string;
  state: TState;
  savedAt: string;
  lastEditedById?: string;
  lastEditedByName?: string;
  lastEditedByRole?: "client" | "adviser";
  version: number;
}

const RECORDS_KEY = "property-cashflow-records";
const ACTIVE_CONTEXT_KEY = "cashflow-active-context";

const stampEditMeta = () => {
  const user = getUser();
  const role = getRole();
  return {
    lastEditedById: user?.id,
    lastEditedByName: user?.name || (role === "adviser" ? "Adviser" : role === "client" ? "Client" : undefined),
    lastEditedByRole: role === "adviser" || role === "client" ? role : undefined,
  };
};

export function getCashflowRecords<TState = unknown>(): CashflowRecord<TState>[] {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    const records = raw ? (JSON.parse(raw) as CashflowRecord<TState>[]) : [];
    return records.map((record) => ({ ...record, version: record.version || 1 }));
  } catch {
    return [];
  }
}

function writeCashflowRecords(records: CashflowRecord[]) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("cashflow-records-changed"));
}

export function setActiveCashflowContext(context: CashflowContext) {
  localStorage.setItem(ACTIVE_CONTEXT_KEY, JSON.stringify(context));
  window.dispatchEvent(new Event("cashflow-context-changed"));
}

export function getActiveCashflowContext(): CashflowContext | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as CashflowContext) : null;
  } catch {
    return null;
  }
}

export function clearActiveCashflowContext() {
  localStorage.removeItem(ACTIVE_CONTEXT_KEY);
  window.dispatchEvent(new Event("cashflow-context-changed"));
}

export function getCashflowForProperty<TState = unknown>(context: CashflowContext): CashflowRecord<TState> | undefined {
  return getCashflowRecords<TState>().find((record) =>
    record.scenarioId === context.scenarioId &&
    record.propertyId === context.propertyId &&
    record.financialYear === context.financialYear
  );
}

export function saveCashflowForProperty<TState>(context: CashflowContext, state: TState, name?: string): CashflowRecord<TState> {
  const records = getCashflowRecords<TState>();
  const existing = getCashflowForProperty<TState>(context);
  const scenario = getScenario(context.scenarioId) as SavedScenario | undefined;
  const next: CashflowRecord<TState> = {
    ...context,
    id: existing?.id || crypto.randomUUID(),
    clientId: context.clientId || scenario?.clientId,
    name: name || existing?.name || `${context.financialYear} cashflow`,
    state,
    savedAt: new Date().toISOString(),
    version: existing ? (existing.version || 1) + 1 : 1,
    ...stampEditMeta(),
  };
  writeCashflowRecords(existing ? records.map((record) => record.id === existing.id ? next : record) : [...records, next]);
  setActiveCashflowContext(context);
  return next;
}

export function deleteCashflowRecord(id: string) {
  writeCashflowRecords(getCashflowRecords().filter((record) => record.id !== id));
}
