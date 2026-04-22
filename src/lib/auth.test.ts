import { beforeEach, describe, expect, it } from "vitest";
import { getRole, getUser, landingFor, logout, setSession } from "@/lib/auth";
import { clearActingAs, getActingAs, setActingAs } from "@/components/AdviserActingBanner";

beforeEach(() => {
  localStorage.clear();
});

describe("auth seam", () => {
  it("stores the active user, role and client-name mirror", () => {
    setSession({ id: "adviser-1", name: "Alex Adviser", email: "alex@atelier.test", role: "adviser" });

    expect(getRole()).toBe("adviser");
    expect(getUser()?.name).toBe("Alex Adviser");
    expect(localStorage.getItem("client-name")).toBe("Alex Adviser");
    expect(landingFor("agent")).toBe("/agent");
  });

  it("logs out auth keys without deleting unrelated working state", () => {
    setSession({ id: "client-1", name: "Sam Client", email: "sam@atelier.test", role: "client" });
    localStorage.setItem("active-scenario-id", "scenario-1");
    logout();

    expect(getRole()).toBeNull();
    expect(getUser()).toBeNull();
    expect(localStorage.getItem("active-scenario-id")).toBe("scenario-1");
  });

  it("keeps adviser acting context separate and clearable", () => {
    setActingAs({ clientId: "client-1", scenarioId: "scenario-1", clientName: "Noah and Ava Murphy", scenarioName: "The Murphys' Plan" });
    expect(getActingAs()?.clientName).toBe("Noah and Ava Murphy");

    clearActingAs();

    expect(getActingAs()).toBeNull();
    expect(localStorage.getItem("active-scenario-id")).toBeNull();
  });
});