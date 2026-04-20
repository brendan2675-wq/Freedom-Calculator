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
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const email = name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com";
    created.push(upsertClient({ name, email, agentIds: [] }));
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
