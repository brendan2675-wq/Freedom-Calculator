/**
 * Demo data seeder — creates 20 dummy clients and 20 dummy scenarios for
 * the adviser dashboard so we can preview lists at scale.
 *
 * Triggered manually from AdviserHome via "Load demo data". Idempotent: when
 * called it appends a fresh batch (ids are uuids, so re-clicking duplicates).
 */
import { upsertClient, type Client } from "@/lib/clients";
import { saveScenario, type ScenarioState } from "@/lib/scenarioManager";
import type { ExistingProperty, FutureProperty } from "@/types/property";

const FIRST_NAMES = [
  "Olivia", "Liam", "Charlotte", "Noah", "Amelia", "Oliver", "Mia", "Jack",
  "Isla", "Leo", "Ava", "William", "Grace", "Henry", "Sophia", "Hudson",
  "Ruby", "Lucas", "Zoe", "Ethan",
];
const LAST_NAMES = [
  "Nguyen", "Smith", "Patel", "Wong", "Brown", "Garcia", "Singh", "Taylor",
  "Lee", "Wilson", "Martin", "Chen", "O'Brien", "Khan", "Walker", "Murphy",
  "Hall", "Reed", "Cooper", "Bennett",
];
const SUBURBS = [
  "Bondi", "Newtown", "Carlton", "Brunswick", "South Yarra", "Paddington",
  "Glebe", "Fitzroy", "St Kilda", "Manly", "Surry Hills", "Toorak",
  "Subiaco", "New Farm", "Teneriffe", "Coogee", "Balmain", "Richmond",
  "Hawthorn", "Annandale",
];
const STATES: Array<ExistingProperty["purchase"]["state"]> = [
  "NSW", "VIC", "QLD", "WA", "SA",
];

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const makePpor = (suburb: string): ExistingProperty => {
  const value = rand(900, 2400) * 1000;
  const loan = Math.round(value * (0.4 + Math.random() * 0.4));
  const purchasePrice = Math.round(value * (0.7 + Math.random() * 0.2));
  return {
    id: "ppor",
    nickname: suburb,
    estimatedValue: value,
    loanBalance: loan,
    earmarked: false,
    sellInYears: 0,
    ownership: "personal",
    investmentType: "house",
    loan: { interestRate: 6.25, repaymentType: "principal-and-interest", ioYears: 0, loanTermYears: 30 },
    rental: { weeklyRent: 0 },
    purchase: {
      purchaseDate: "",
      settlementDate: "",
      purchasePrice,
      deposit: Math.round(purchasePrice * 0.2),
      stampDuty: Math.round(purchasePrice * 0.04),
      otherCosts: 3000,
      state: pick(STATES),
    },
  } as unknown as ExistingProperty;
};

const makeInvestment = (i: number): ExistingProperty => {
  const value = rand(450, 1200) * 1000;
  const loan = Math.round(value * (0.5 + Math.random() * 0.35));
  const weekly = rand(420, 950);
  const purchasePrice = Math.round(value * (0.65 + Math.random() * 0.2));
  return {
    id: `inv-${crypto.randomUUID()}`,
    nickname: `${pick(SUBURBS)} IP${i + 1}`,
    estimatedValue: value,
    loanBalance: loan,
    earmarked: false,
    sellInYears: 0,
    ownership: pick(["personal", "trust"] as const),
    investmentType: pick(["house", "unit", "townhouse"] as const),
    loan: { interestRate: 6.5, repaymentType: "interest-only", ioYears: 5, loanTermYears: 30 },
    rental: { weeklyRent: weekly },
    purchase: {
      purchaseDate: "",
      settlementDate: "",
      purchasePrice,
      deposit: Math.round(purchasePrice * 0.2),
      stampDuty: Math.round(purchasePrice * 0.04),
      otherCosts: 2500,
      state: pick(STATES),
    },
  } as unknown as ExistingProperty;
};

const makeFuture = (i: number): FutureProperty => {
  const price = rand(500, 1100) * 1000;
  return {
    id: `fp-${crypto.randomUUID()}`,
    nickname: `Proposed ${pick(SUBURBS)}`,
    estimatedValue: price,
    purchasePrice: price,
    yearsUntilPurchase: rand(1, 5),
    weeklyRent: rand(450, 850),
    state: pick(STATES),
    investmentType: pick(["house", "unit", "townhouse"] as const),
    ownership: "personal",
  } as unknown as FutureProperty;
};

const buildState = (clientName: string): ScenarioState => {
  const suburb = pick(SUBURBS);
  const investmentCount = rand(0, 4);
  const futureCount = rand(0, 2);
  const thisYear = new Date().getFullYear();
  return {
    clientName,
    interestRate: 6.5,
    targetMonth: rand(0, 11),
    targetYear: thisYear + rand(7, 15),
    growthRate: 6 + Math.random() * 1.5,
    pporSuburb: suburb,
    ppor: makePpor(suburb),
    existingProperties: Array.from({ length: investmentCount }, (_, i) => makeInvestment(i)),
    futureProperties: Array.from({ length: futureCount }, (_, i) => makeFuture(i)),
  };
};

export function seedDemoData(count = 20): { clients: number; scenarios: number } {
  const created: Client[] = [];
  for (let i = 0; i < count; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com";
    const client = upsertClient({ name, email, agentIds: [] });
    created.push(client);
  }
  for (const client of created) {
    const state = buildState(client.name);
    const scenarioName = `${client.name.split(" ")[0]}'s Plan`;
    saveScenario(scenarioName, state, {
      clientId: client.id,
      ownerRole: "adviser",
      type: "individual",
    });
  }
  return { clients: created.length, scenarios: created.length };
}
