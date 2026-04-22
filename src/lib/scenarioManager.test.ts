import { beforeEach, describe, expect, it } from "vitest";
import { setSession } from "@/lib/auth";
import { upsertClient } from "@/lib/clients";
import {
  applyScenarioToStorage,
  buildScenarioFromStorage,
  getActiveScenario,
  getSavedScenarios,
  saveActiveScenarioFromWorkingState,
  saveScenario,
  setActiveScenario,
  setScenarioMeta,
  updateScenario,
  type ScenarioState,
} from "@/lib/scenarioManager";

const makeState = (clientName = "Noah and Ava Murphy"): ScenarioState => ({
  clientName,
  interestRate: 6.5,
  targetMonth: 0,
  targetYear: 2036,
  growthRate: 6.5,
  pporSuburb: "Mosman",
  ppor: {
    id: "ppor",
    nickname: "Family home",
    estimatedValue: 2_400_000,
    loanBalance: 1_200_000,
    earmarked: false,
    sellInYears: 0,
    ownership: "personal",
    investmentType: "house",
    loan: { interestRate: 6.2, interestOnlyPeriodYears: 0, loanTermYears: 30, lenderName: "", offsetBalance: 0 },
    rental: { weeklyRent: 0, vacancyRatePercent: 0, propertyManagerFeePercent: 0 },
    purchase: { purchaseDate: "", settlementDate: "", purchasePrice: 0, stampDuty: 0 },
  },
  existingProperties: [],
  futureProperties: [],
});

beforeEach(() => {
  localStorage.clear();
  setSession({ id: "adviser-user", name: "Alex Adviser", email: "alex@atelier.test", role: "adviser" });
});

describe("scenarioManager", () => {
  it("saves, normalises and updates scenario metadata without losing sharing fields", () => {
    const scenario = saveScenario("The Murphys' Plan", makeState(), {
      clientId: "client-1",
      ownerId: "adviser-user",
      ownerRole: "adviser",
      sharedAgentIds: ["agent-1"],
      type: "smsf",
    });

    expect(getSavedScenarios()).toHaveLength(1);
    expect(scenario.version).toBe(1);
    expect(scenario.lastEditedByName).toBe("Alex Adviser");

    const updated = updateScenario(scenario.id, { ...makeState(), pporSuburb: "Manly" });

    expect(updated?.version).toBe(2);
    expect(updated?.clientId).toBe("client-1");
    expect(updated?.sharedAgentIds).toEqual(["agent-1"]);
    expect(updated?.type).toBe("smsf");
  });

  it("supports unassigned adviser drafts and assigns them later without changing scenario id", () => {
    const client = upsertClient({ name: "Noah and Ava Murphy", email: "murphys@example.com", agentIds: [] });
    const draft = saveScenario("Working Scenario", makeState("Unassigned client"), {
      ownerId: "adviser-user",
      ownerRole: "adviser",
    });

    expect(draft.clientId).toBeUndefined();
    expect(draft.state.clientName).toBe("Unassigned client");

    const assigned = setScenarioMeta(draft.id, { clientId: client.id, type: "individual", sharedAgentIds: ["agent-1"] });

    expect(assigned?.id).toBe(draft.id);
    expect(assigned?.clientId).toBe(client.id);
    expect(assigned?.state.clientName).toBe("Noah and Ava Murphy");
    expect(assigned?.sharedAgentIds).toEqual(["agent-1"]);
  });

  it("tracks active scenario versions and reports conflicts", () => {
    const scenario = saveScenario("Conflict Check", makeState(), { ownerId: "adviser-user", ownerRole: "adviser" });
    applyScenarioToStorage(scenario.state);
    setActiveScenario(scenario.id);
    updateScenario(scenario.id, makeState("Updated somewhere else"));

    const result = saveActiveScenarioFromWorkingState();

    expect(result.conflict).toBe(true);
    expect(result.scenario?.version).toBe(3);
    expect(getActiveScenario()?.id).toBe(scenario.id);
  });

  it("falls back safely when stored scenario JSON is malformed", () => {
    localStorage.setItem("saved-scenarios", "not-json");

    expect(getSavedScenarios()).toEqual([]);
    expect(buildScenarioFromStorage().clientName).toBe("Alex Adviser");
  });
});