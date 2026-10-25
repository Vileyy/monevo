import { CurrencyCode } from "./currencies";

/** Every stored amount is VND; display currencies are derived from it. */
export const BASE_CURRENCY: CurrencyCode = "VND";

export type RateMap = Partial<Record<CurrencyCode, number>>;

/** Units of `code` per 1 VND, or null when the rate is missing/invalid. */
export function rateFor(code: CurrencyCode, rates: RateMap): number | null {
  if (code === BASE_CURRENCY) return 1;

  const rate = rates[code];
  return typeof rate === "number" && Number.isFinite(rate) && rate > 0
    ? rate
    : null;
}

export function convertFromBase(
  amount: number,
  code: CurrencyCode,
  rates: RateMap,
): number | null {
  const rate = rateFor(code, rates);
  return rate === null ? null : amount * rate;
}

export function convertToBase(
  amount: number,
  code: CurrencyCode,
  rates: RateMap,
): number | null {
  const rate = rateFor(code, rates);
  return rate === null ? null : amount / rate;
}

export function roundToPrecision(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
