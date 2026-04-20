/**
 * Demo data seeder — creates 20 dummy clients and 20 dummy scenarios for
 * the adviser dashboard so we can preview lists at scale.
 *
 * Triggered manually from AdviserHome via "Load demo data". Each call appends
 * a fresh batch (uuids), so re-clicking duplicates intentionally.
 */
import { upsertClient, type Client } from "@/lib/clients";
import { saveScenario, type ScenarioState } from "@/lib/scenarioManager";
import {
  defaultLoanDetails, defaultRentalDetails,
  type ExistingProperty, type FutureProperty, type InvestmentType,
} from "@/types/property";
import type { AustralianState } from "@/lib/stampDuty";

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
const STATES: AustralianState[] = ["NSW", "VIC", "QLD", "WA", "SA"];
const INVESTMENT_TYPES: InvestmentType[] = ["house", "unit", "townhouse"];

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

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
    loan: { ...defaultLoanDetails, interestRate: 6.25 },
    rental: { ...defaultRentalDetails, weeklyRent: 0 },
    purchase: {
      purchaseDate: "",
      settlementDate: "",
      purchasePrice,
      stampDuty: Math.round(purchasePrice * 0.04),
    },
    state: pick(STATES),
  };
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
    investmentType: pick(INVESTMENT_TYPES),
    loan: { ...defaultLoanDetails, interestRate: 6.5, interestOnlyPeriodYears: 5 },
    rental: { ...defaultRentalDetails, weeklyRent: weekly },
    purchase: {
      purchaseDate: "",
      settlementDate: "",
      purchasePrice,
      stampDuty: Math.round(purchasePrice * 0.04),
    },
    state: pick(STATES),
  };
};

const makeFuture = (): FutureProperty => {
  const price = rand(500, 1100) * 1000;
  const weekly = rand(450, 850);
  return {
    id: `fp-${crypto.randomUUID()}`,
    suburb: pick(SUBURBS),
    purchasePrice: price,
    rentalYield: +(((weekly * 52) / price) * 100).toFixed(2),
    projectedEquity5yr: Math.round(price * 0.25),
    lvr: 80,
    ownership: "personal",
    investmentType: pick(INVESTMENT_TYPES),
    loan: { ...defaultLoanDetails, interestRate: 6.5 },
    rental: { ...defaultRentalDetails, weeklyRent: weekly },
    purchase: {
      purchaseDate: "",
      settlementDate: "",
      purchasePrice: price,
      stampDuty: Math.round(price * 0.04),
    },
    state: pick(STATES),
    proposedLoanAmount: Math.round(price * 0.8),
  };
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
    growthRate: +(6 + Math.random() * 1.5).toFixed(2),
    pporSuburb: suburb,
    ppor: makePpor(suburb),
    existingProperties: Array.from({ length: investmentCount }, (_, i) => makeInvestment(i)),
    futureProperties: Array.from({ length: futureCount }, () => makeFuture()),
  };
};

export function seedDemoData(count = 20): { clients: number; scenarios: number } {
  const created: Client[] = [];
  for (let i = 0; i < count; i++) {
    const surname = pick(LAST_NAMES);
    const isCouple = Math.random() < 0.45; // ~45% couples
    let name: string;
    if (isCouple) {
      let first1 = pick(FIRST_NAMES);
      let first2 = pick(FIRST_NAMES);
      while (first2 === first1) first2 = pick(FIRST_NAMES);
      name = `${first1} and ${first2} ${surname}`;
    } else {
      name = `${pick(FIRST_NAMES)} ${surname}`;
    }
    const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com";
    created.push(upsertClient({ name, email, agentIds: [] }));
  }
  const PLAN_LABELS = ["Base Plan", "Aggressive Growth", "Conservative", "Sell-down 2030", "SMSF Path"];
  let scenarioCount = 0;
  for (const client of created) {
    // Label uses surname for couples (last word), first name for individuals
    const parts = client.name.split(" ");
    const isCouple = client.name.includes(" and ");
    const label0 = isCouple ? `The ${parts[parts.length - 1]}s` : parts[0];
    // Most clients get 1 scenario; ~30% get 2; ~10% get 3 — so we can see the count badge vary
    const r = Math.random();
    const planCount = r < 0.1 ? 3 : r < 0.4 ? 2 : 1;
    for (let i = 0; i < planCount; i++) {
      const state = buildState(client.name);
      const label = i === 0 ? `${label0}'s Plan` : `${label0} — ${PLAN_LABELS[i]}`;
      saveScenario(label, state, {
        clientId: client.id,
        ownerRole: "adviser",
        type: "individual",
      });
      scenarioCount++;
    }
  }
  return { clients: created.length, scenarios: scenarioCount };
}

/**
 * Wipe all clients, agents, and saved scenarios. Also clears any active
 * adviser-acting-as context so the banner disappears. Useful for resetting
 * between demo previews.
 */
export function clearDemoData(): { clients: number; agents: number; scenarios: number } {
  const counts = {
    clients: (JSON.parse(localStorage.getItem("clients") || "[]") as unknown[]).length,
    agents: (JSON.parse(localStorage.getItem("agents") || "[]") as unknown[]).length,
    scenarios: (JSON.parse(localStorage.getItem("saved-scenarios") || "[]") as unknown[]).length,
  };
  localStorage.removeItem("clients");
  localStorage.removeItem("agents");
  localStorage.removeItem("saved-scenarios");
  localStorage.removeItem("active-scenario-id");
  localStorage.removeItem("adviser-acting-as");
  return counts;
}
