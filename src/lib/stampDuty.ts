export type AustralianState = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";

export const australianStates: { value: AustralianState; label: string }[] = [
  { value: "NSW", label: "New South Wales" },
  { value: "VIC", label: "Victoria" },
  { value: "QLD", label: "Queensland" },
  { value: "WA", label: "Western Australia" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NT", label: "Northern Territory" },
];

type Bracket = { threshold: number; base: number; rate: number };

function calcFromBrackets(price: number, brackets: Bracket[]): number {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (price > brackets[i].threshold) {
      return Math.round(brackets[i].base + (price - brackets[i].threshold) * brackets[i].rate);
    }
  }
  return Math.round(price * (brackets[0]?.rate || 0.05));
}

/**
 * Calculate stamp duty for an Australian state/territory.
 * Uses historical rates based on purchase date when provided.
 * Rates sourced from state revenue offices.
 */
export function calculateStampDuty(price: number, state: AustralianState, purchaseDate?: string): number {
  if (price <= 0) return 0;

  const date = purchaseDate ? new Date(purchaseDate) : new Date();

  switch (state) {
    case "NSW": return calcNSW(price, date);
    case "VIC": return calcVIC(price, date);
    case "QLD": return calcQLD(price, date);
    case "WA":  return calcWA(price, date);
    case "SA":  return calcSA(price, date);
    case "TAS": return calcTAS(price, date);
    case "ACT": return calcACT(price, date);
    case "NT":  return calcNT(price, date);
    default:    return Math.round(price * 0.05);
  }
}

// ─── NSW ────────────────────────────────────────────────────────────────────────
// Pre-Jul 2019: fixed brackets (unchanged since ~1986)
// Jul 2019+: CPI-indexed brackets (updated annually)
function calcNSW(v: number, d: Date): number {
  if (d < new Date("2019-07-01")) {
    // Pre-CPI indexing rates
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 14000,   base: 175,     rate: 0.015 },
      { threshold: 30000,   base: 415,     rate: 0.0175 },
      { threshold: 80000,   base: 1290,    rate: 0.035 },
      { threshold: 300000,  base: 8990,    rate: 0.045 },
      { threshold: 1000000, base: 40490,   rate: 0.055 },
      { threshold: 3000000, base: 150490,  rate: 0.07 },
    ]);
  }
  if (d < new Date("2020-07-01")) {
    // FY2019-20 (first CPI-indexed year, minor adjustments)
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 14000,   base: 175,     rate: 0.015 },
      { threshold: 31000,   base: 430,     rate: 0.0175 },
      { threshold: 83000,   base: 1340,    rate: 0.035 },
      { threshold: 310000,  base: 9285,    rate: 0.045 },
      { threshold: 1033000, base: 41820,   rate: 0.055 },
      { threshold: 3098000, base: 155395,  rate: 0.07 },
    ]);
  }
  if (d < new Date("2021-07-01")) {
    // FY2020-21
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 14000,   base: 175,     rate: 0.015 },
      { threshold: 32000,   base: 445,     rate: 0.0175 },
      { threshold: 85000,   base: 1373,    rate: 0.035 },
      { threshold: 319000,  base: 9563,    rate: 0.045 },
      { threshold: 1064000, base: 43088,   rate: 0.055 },
      { threshold: 3193000, base: 160183,  rate: 0.07 },
    ]);
  }
  if (d < new Date("2022-07-01")) {
    // FY2021-22
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 15000,   base: 188,     rate: 0.015 },
      { threshold: 32000,   base: 443,     rate: 0.0175 },
      { threshold: 87000,   base: 1405,    rate: 0.035 },
      { threshold: 327000,  base: 9805,    rate: 0.045 },
      { threshold: 1089000, base: 44195,   rate: 0.055 },
      { threshold: 3268000, base: 163845,  rate: 0.07 },
    ]);
  }
  if (d < new Date("2023-07-01")) {
    // FY2022-23
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 16000,   base: 200,     rate: 0.015 },
      { threshold: 35000,   base: 485,     rate: 0.0175 },
      { threshold: 93000,   base: 1500,    rate: 0.035 },
      { threshold: 351000,  base: 10530,   rate: 0.045 },
      { threshold: 1168000, base: 47295,   rate: 0.055 },
      { threshold: 3505000, base: 175830,  rate: 0.07 },
    ]);
  }
  if (d < new Date("2024-07-01")) {
    // FY2023-24
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,       rate: 0.0125 },
      { threshold: 17000,   base: 213,     rate: 0.015 },
      { threshold: 36000,   base: 498,     rate: 0.0175 },
      { threshold: 97000,   base: 1566,    rate: 0.035 },
      { threshold: 364000,  base: 10911,   rate: 0.045 },
      { threshold: 1212000, base: 49071,   rate: 0.055 },
      { threshold: 3636000, base: 182391,  rate: 0.07 },
    ]);
  }
  // FY2024-25 & 2025-26 (current rates, unchanged from FY23-24 for simplicity)
  return calcFromBrackets(v, [
    { threshold: 0,       base: 0,       rate: 0.0125 },
    { threshold: 17000,   base: 213,     rate: 0.015 },
    { threshold: 36000,   base: 498,     rate: 0.0175 },
    { threshold: 97000,   base: 1566,    rate: 0.035 },
    { threshold: 364000,  base: 10911,   rate: 0.045 },
    { threshold: 1212000, base: 49071,   rate: 0.055 },
    { threshold: 3636000, base: 182391,  rate: 0.07 },
  ]);
}

// ─── VIC ────────────────────────────────────────────────────────────────────────
// Pre-Apr 1998: old thresholds
// Apr 1998 - May 2008: updated thresholds
// May 2008 - Jun 2021: updated thresholds, 5.5% flat above $960k
// Jul 2021+: added premium tier ($2M+) at 6.5%
function calcVIC(v: number, d: Date): number {
  if (d < new Date("1998-04-21")) {
    return calcFromBrackets(v, [
      { threshold: 0,      base: 0,     rate: 0.014 },
      { threshold: 20000,  base: 280,   rate: 0.024 },
      { threshold: 100000, base: 2200,  rate: 0.06 },
      { threshold: 760000, base: 41800, rate: 0.055 },
    ]);
  }
  if (d < new Date("2008-05-06")) {
    return calcFromBrackets(v, [
      { threshold: 0,       base: 0,     rate: 0.014 },
      { threshold: 20000,   base: 280,   rate: 0.024 },
      { threshold: 115000,  base: 2560,  rate: 0.06 },
      { threshold: 870000,  base: 0,     rate: 0.055 }, // flat 5.5% of total
    ]);
  }
  if (d < new Date("2021-07-01")) {
    // 5.5% flat above $960k
    if (v > 960000) return Math.round(v * 0.055);
    return calcFromBrackets(v, [
      { threshold: 0,      base: 0,    rate: 0.014 },
      { threshold: 25000,  base: 350,  rate: 0.024 },
      { threshold: 130000, base: 2870, rate: 0.06 },
    ]);
  }
  // Jul 2021+ (added $2M premium tier)
  if (v <= 25000) return Math.round(v * 0.014);
  if (v <= 130000) return Math.round(350 + (v - 25000) * 0.024);
  if (v <= 960000) return Math.round(2870 + (v - 130000) * 0.06);
  if (v <= 2000000) return Math.round(v * 0.055);
  return Math.round(110000 + (v - 2000000) * 0.065);
}

// ─── QLD ────────────────────────────────────────────────────────────────────────
// Pre-Aug 2011: lower top rate ($3.75 per $100)
// Aug 2011+: current rates with $5.75 top rate
function calcQLD(v: number, d: Date): number {
  if (d < new Date("2011-08-01")) {
    // Old QLD rates (pre-Aug 2011)
    if (v <= 5000) return 0;
    if (v <= 75000)   return Math.round((v - 5000) * 0.015);
    if (v <= 540000)  return Math.round(1050 + (v - 75000) * 0.035);
    if (v <= 1000000) return Math.round(17325 + (v - 540000) * 0.0375);
    return Math.round(34575 + (v - 1000000) * 0.045);
  }
  if (d < new Date("2012-06-01")) {
    // Transitional period (Aug 2011 - Jun 2012)
    if (v <= 5000) return 0;
    if (v <= 75000)   return Math.round((v - 5000) * 0.015);
    if (v <= 540000)  return Math.round(1050 + (v - 75000) * 0.035);
    if (v <= 1000000) return Math.round(17325 + (v - 540000) * 0.045);
    return Math.round(38025 + (v - 1000000) * 0.0525);
  }
  // Jun 2012+ (current rates)
  if (v <= 5000) return 0;
  if (v <= 75000)   return Math.round((v - 5000) * 0.015);
  if (v <= 540000)  return Math.round(1050 + (v - 75000) * 0.035);
  if (v <= 1000000) return Math.round(17325 + (v - 540000) * 0.045);
  return Math.round(38025 + (v - 1000000) * 0.0575);
}

// ─── WA ─────────────────────────────────────────────────────────────────────────
// Rates have been relatively stable; using current rates for all periods
function calcWA(v: number, _d: Date): number {
  return calcFromBrackets(v, [
    { threshold: 0,      base: 0,     rate: 0.019 },
    { threshold: 120000, base: 2280,  rate: 0.0285 },
    { threshold: 150000, base: 3135,  rate: 0.038 },
    { threshold: 360000, base: 11115, rate: 0.0475 },
    { threshold: 725000, base: 28453, rate: 0.0515 },
  ]);
}

// ─── SA ─────────────────────────────────────────────────────────────────────────
// Rates have been relatively stable; using current rates for all periods
function calcSA(v: number, _d: Date): number {
  return calcFromBrackets(v, [
    { threshold: 0,      base: 0,     rate: 0.01 },
    { threshold: 12000,  base: 120,   rate: 0.02 },
    { threshold: 30000,  base: 480,   rate: 0.03 },
    { threshold: 50000,  base: 1080,  rate: 0.035 },
    { threshold: 100000, base: 2830,  rate: 0.04 },
    { threshold: 200000, base: 6830,  rate: 0.0425 },
    { threshold: 250000, base: 8955,  rate: 0.0475 },
    { threshold: 300000, base: 11330, rate: 0.05 },
    { threshold: 500000, base: 21330, rate: 0.055 },
  ]);
}

// ─── TAS ────────────────────────────────────────────────────────────────────────
function calcTAS(v: number, _d: Date): number {
  if (v <= 3000) return 50;
  return calcFromBrackets(v, [
    { threshold: 3000,   base: 50,    rate: 0.0175 },
    { threshold: 25000,  base: 435,   rate: 0.0225 },
    { threshold: 75000,  base: 1560,  rate: 0.035 },
    { threshold: 200000, base: 5935,  rate: 0.04 },
    { threshold: 375000, base: 12935, rate: 0.0425 },
    { threshold: 725000, base: 27810, rate: 0.045 },
  ]);
}

// ─── ACT ────────────────────────────────────────────────────────────────────────
// ACT is progressively abolishing stamp duty; rates decrease over time
// Using current transitional rates
function calcACT(v: number, _d: Date): number {
  return calcFromBrackets(v, [
    { threshold: 0,       base: 0,     rate: 0.006 },
    { threshold: 260000,  base: 1560,  rate: 0.022 },
    { threshold: 300000,  base: 2440,  rate: 0.034 },
    { threshold: 500000,  base: 9240,  rate: 0.0432 },
    { threshold: 750000,  base: 20040, rate: 0.059 },
    { threshold: 1000000, base: 34790, rate: 0.064 },
  ]);
}

// ─── NT ─────────────────────────────────────────────────────────────────────────
// NT uses a formula-based approach
function calcNT(v: number, _d: Date): number {
  // NT uses: D = (0.06571441 × V²) / 1000
  // Capped at effective rates that taper for high values
  if (v <= 525000) {
    const duty = (0.06571441 * v * v) / 1000;
    return Math.round(Math.min(duty, v * 0.055));
  }
  if (v <= 3000000) {
    const base = (0.06571441 * 525000 * 525000) / 1000;
    const excess = v - 525000;
    const marginalRate = 0.0495 - (excess / 3000000) * 0.015;
    return Math.round(base + excess * Math.max(marginalRate, 0.035));
  }
  return Math.round(v * 0.0495);
}
