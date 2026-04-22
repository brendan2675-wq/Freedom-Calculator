import { beforeEach, describe, expect, it } from "vitest";
import { setSession } from "@/lib/auth";
import { saveScenario, type ScenarioState } from "@/lib/scenarioManager";
import {
  clearActiveCashflowContext,
  getActiveCashflowContext,
  getCashflowForProperty,
  getCashflowRecords,
  saveCashflowForProperty,
  setActiveCashflowContext,
  type CashflowContext,
} from "@/lib/cashflowManager";

const baseState: ScenarioState = {
  clientName: "Noah and Ava Murphy",
  interestRate: 6.5,
  targetMonth: 0,
  targetYear: 2036,
  growthRate: 6.5,
  pporSuburb: "",
  ppor: {} as ScenarioState["ppor"],
  existingProperties: [],
  futureProperties: [],
};

beforeEach(() => {
  localStorage.clear();
  setSession({ id: "client-user", name: "Sam Client", email: "sam@atelier.test", role: "client" });
});

describe("cashflowManager", () => {
  it("saves and retrieves a property-linked cashflow record by scenario, property and year", () => {
    const scenario = saveScenario("Linked Scenario", baseState, { clientId: "client-1", ownerId: "client-user", ownerRole: "client" });
    const context: CashflowContext = { clientId: "client-1", scenarioId: scenario.id, propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" };

    const record = saveCashflowForProperty(context, { rent: 3200 }, "FY2027 cashflow");

    expect(record.clientId).toBe("client-1");
    expect(record.lastEditedByName).toBe("Sam Client");
    expect(getCashflowForProperty(context)?.state).toEqual({ rent: 3200 });
    expect(getActiveCashflowContext()).toEqual(context);
  });

  it("isolates cashflow records across scenarios and financial years", () => {
    const scenarioA = saveScenario("Scenario A", baseState);
    const scenarioB = saveScenario("Scenario B", baseState);
    const contextA: CashflowContext = { scenarioId: scenarioA.id, propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" };
    const contextB: CashflowContext = { scenarioId: scenarioB.id, propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" };
    const contextNextYear: CashflowContext = { ...contextA, financialYear: "FY2028" };

    saveCashflowForProperty(contextA, { net: 100 });
    saveCashflowForProperty(contextB, { net: 200 });
    saveCashflowForProperty(contextNextYear, { net: 300 });

    expect(getCashflowForProperty(contextA)?.state).toEqual({ net: 100 });
    expect(getCashflowForProperty(contextB)?.state).toEqual({ net: 200 });
    expect(getCashflowForProperty(contextNextYear)?.state).toEqual({ net: 300 });
  });

  it("updates existing records in place and increments version", () => {
    const context: CashflowContext = { scenarioId: "scenario-1", propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" };

    const first = saveCashflowForProperty(context, { net: 100 });
    const second = saveCashflowForProperty(context, { net: 150 });

    expect(second.id).toBe(first.id);
    expect(second.version).toBe(2);
    expect(getCashflowRecords()).toHaveLength(1);
  });

  it("clears active context and handles malformed storage safely", () => {
    const context: CashflowContext = { scenarioId: "scenario-1", propertyId: "property-1", propertyType: "investment", financialYear: "FY2027" };
    setActiveCashflowContext(context);
    clearActiveCashflowContext();
    localStorage.setItem("property-cashflow-records", "not-json");

    expect(getActiveCashflowContext()).toBeNull();
    expect(getCashflowRecords()).toEqual([]);
  });
});