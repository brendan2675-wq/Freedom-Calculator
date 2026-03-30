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

/**
 * Calculate stamp duty (transfer duty) for an Australian state/territory.
 * Based on 2026 general rates for investment properties (no FHB concessions).
 */
export function calculateStampDuty(price: number, state: AustralianState): number {
  if (price <= 0) return 0;

  switch (state) {
    case "NSW":
      return calcNSW(price);
    case "VIC":
      return calcVIC(price);
    case "QLD":
      return calcQLD(price);
    case "WA":
      return calcWA(price);
    case "SA":
      return calcSA(price);
    case "TAS":
      return calcTAS(price);
    case "ACT":
      return calcACT(price);
    case "NT":
      return calcNT(price);
    default:
      return Math.round(price * 0.05); // fallback 5%
  }
}

// NSW progressive rates
function calcNSW(v: number): number {
  if (v <= 17000) return Math.round(v * 0.0125);
  if (v <= 36000) return Math.round(213 + (v - 17000) * 0.015);
  if (v <= 97000) return Math.round(498 + (v - 36000) * 0.0175);
  if (v <= 364000) return Math.round(1566 + (v - 97000) * 0.035);
  if (v <= 1212000) return Math.round(10911 + (v - 364000) * 0.045);
  if (v <= 3636000) return Math.round(49071 + (v - 1212000) * 0.055);
  return Math.round(182391 + (v - 3636000) * 0.07);
}

// VIC progressive rates
function calcVIC(v: number): number {
  if (v <= 25000) return Math.round(v * 0.014);
  if (v <= 130000) return Math.round(350 + (v - 25000) * 0.024);
  if (v <= 960000) return Math.round(2870 + (v - 130000) * 0.06);
  if (v <= 2000000) return Math.round(v * 0.055);
  return Math.round(110000 + (v - 2000000) * 0.065);
}

// QLD progressive rates
function calcQLD(v: number): number {
  if (v <= 5000) return 0;
  if (v <= 75000) return Math.round((v - 5000) * 0.015);
  if (v <= 540000) return Math.round(1050 + (v - 75000) * 0.035);
  if (v <= 1000000) return Math.round(17325 + (v - 540000) * 0.045);
  return Math.round(38025 + (v - 1000000) * 0.0575);
}

// WA progressive rates
function calcWA(v: number): number {
  if (v <= 120000) return Math.round(v * 0.019);
  if (v <= 150000) return Math.round(2280 + (v - 120000) * 0.0285);
  if (v <= 360000) return Math.round(3135 + (v - 150000) * 0.038);
  if (v <= 725000) return Math.round(11115 + (v - 360000) * 0.0475);
  return Math.round(28453 + (v - 725000) * 0.0515);
}

// SA progressive rates
function calcSA(v: number): number {
  if (v <= 12000) return Math.round(v * 0.01);
  if (v <= 30000) return Math.round(120 + (v - 12000) * 0.02);
  if (v <= 50000) return Math.round(480 + (v - 30000) * 0.03);
  if (v <= 100000) return Math.round(1080 + (v - 50000) * 0.035);
  if (v <= 200000) return Math.round(2830 + (v - 100000) * 0.04);
  if (v <= 250000) return Math.round(6830 + (v - 200000) * 0.0425);
  if (v <= 300000) return Math.round(8955 + (v - 250000) * 0.0475);
  if (v <= 500000) return Math.round(11330 + (v - 300000) * 0.05);
  return Math.round(21330 + (v - 500000) * 0.055);
}

// TAS progressive rates
function calcTAS(v: number): number {
  if (v <= 3000) return 50;
  if (v <= 25000) return Math.round(50 + (v - 3000) * 0.0175);
  if (v <= 75000) return Math.round(435 + (v - 25000) * 0.0225);
  if (v <= 200000) return Math.round(1560 + (v - 75000) * 0.035);
  if (v <= 375000) return Math.round(5935 + (v - 200000) * 0.04);
  if (v <= 725000) return Math.round(12935 + (v - 375000) * 0.0425);
  return Math.round(27810 + (v - 725000) * 0.045);
}

// ACT progressive rates (transitional 2026)
function calcACT(v: number): number {
  if (v <= 260000) return Math.round(v * 0.006);
  if (v <= 300000) return Math.round(1560 + (v - 260000) * 0.022);
  if (v <= 500000) return Math.round(2440 + (v - 300000) * 0.034);
  if (v <= 750000) return Math.round(9240 + (v - 500000) * 0.0432);
  if (v <= 1000000) return Math.round(20040 + (v - 750000) * 0.059);
  return Math.round(34790 + (v - 1000000) * 0.064);
}

// NT uses a formula-based approach; approximation via interpolation
function calcNT(v: number): number {
  // NT formula: D = (0.06571441 × V^2) / 1000, capped/adjusted
  // Using the known data points for interpolation:
  // $300k -> ~$9,682, $500k -> ~$23,929, $700k -> ~$38,177, $1M -> ~$47,489
  // Simplified formula approximation:
  const vInThousands = v / 1000;
  if (v <= 525000) {
    // Linear interpolation from data points
    const duty = (0.06571441 * v * v) / 1000;
    return Math.round(Math.min(duty, v * 0.055));
  }
  // Above $525k, rate tapers
  if (v <= 3000000) {
    const base = (0.06571441 * 525000 * 525000) / 1000;
    const excess = v - 525000;
    // Diminishing marginal rate
    const marginalRate = 0.0495 - (excess / 3000000) * 0.015;
    return Math.round(base + excess * Math.max(marginalRate, 0.035));
  }
  // Very high values: ~4.95%
  return Math.round(v * 0.0495);
}
