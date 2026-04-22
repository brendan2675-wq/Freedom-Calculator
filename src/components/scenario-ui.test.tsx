import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { setSession } from "@/lib/auth";
import { saveScenario, setActiveScenario, type ScenarioState } from "@/lib/scenarioManager";
import ScenarioContextBanner from "@/components/ScenarioContextBanner";
import ScenarioManager from "@/components/ScenarioManager";
import NewScenarioDialog from "@/components/NewScenarioDialog";

const state: ScenarioState = {
  clientName: "Unassigned client",
  interestRate: 6.5,
  targetMonth: 0,
  targetYear: 2036,
  growthRate: 6.5,
  pporSuburb: "",
  ppor: {} as ScenarioState["ppor"],
  existingProperties: [],
  futureProperties: [],
};

const renderWithRouter = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>);

beforeEach(() => {
  localStorage.clear();
});

describe("role-aware scenario UI", () => {
  it("shows adviser editing state, update action and dashboard exit for adviser scenarios", () => {
    setSession({ id: "adviser-1", name: "Alex Adviser", email: "alex@atelier.test", role: "adviser" });
    const scenario = saveScenario("Working Scenario", state, { ownerId: "adviser-1", ownerRole: "adviser" });
    setActiveScenario(scenario.id);

    renderWithRouter(<ScenarioContextBanner />);

    expect(screen.getByText("Adviser editing")).toBeInTheDocument();
    expect(screen.getByText("Working Scenario")).toBeInTheDocument();
    expect(screen.getByText(/Unassigned client/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update scenario/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adviser dashboard/i })).toBeInTheDocument();
  });

  it("shows read-only scenario state and hides update action for agents", () => {
    setSession({ id: "agent-1", name: "Jordan Agent", email: "jordan@atelier.test", role: "agent" });
    const scenario = saveScenario("Shared Scenario", state, { sharedAgentIds: ["agent-record-1"] });
    setActiveScenario(scenario.id);

    renderWithRouter(<ScenarioContextBanner readOnly />);

    expect(screen.getByText("Read-only scenario")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /update scenario/i })).not.toBeInTheDocument();
  });

  it("labels unassigned adviser scenarios as needing a client in ScenarioManager", async () => {
    setSession({ id: "adviser-1", name: "Alex Adviser", email: "alex@atelier.test", role: "adviser" });
    saveScenario("Strategy Draft", state, { ownerId: "adviser-1", ownerRole: "adviser" });

    renderWithRouter(<ScenarioManager getCurrentState={() => state} loadState={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /scenarios/i }));

    expect(screen.getAllByText("Client scenarios").length).toBeGreaterThan(0);
    expect(screen.getByText("Needs client")).toBeInTheDocument();
  });

  it("supports the build-without-client path in NewScenarioDialog", async () => {
    const onCreate = vi.fn();

    render(<NewScenarioDialog open onOpenChange={vi.fn()} onCreate={onCreate} />);
    fireEvent.click(screen.getByText("Build without client"));

    expect(screen.getByText(/assign it later/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Working Scenario")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /create scenario/i }));

    expect(onCreate).toHaveBeenCalledWith({ client: undefined, scenarioName: "Working Scenario" });
  });
});