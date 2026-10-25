import {
  BASE_CURRENCY,
  convertFromBase,
  convertToBase,
  rateFor,
  roundToPrecision,
} from "@/lib/currency-conversion";

describe("currency conversion", () => {
  const rates = { USD: 0.00004, EUR: 0.000036, JPY: 0.0059 };

  it("uses VND as the base currency with an implicit rate of 1", () => {
    expect(BASE_CURRENCY).toBe("VND");
    expect(rateFor("VND", rates)).toBe(1);
  });

  it("adds a safe result for each target currency", () => {
    const base = 1000000;
    expect(convertFromBase(base, "VND", rates)).toBe(1000000);
    expect(convertFromBase(base, "USD", rates)).toBeCloseTo(40, 6);
    expect(convertFromBase(base, "JPY", rates)).toBeCloseTo(5900, 6);
  });

  it("converts display amounts back to base", () => {
    expect(convertToBase(40, "USD", rates)).toBeCloseTo(1000000, 6);
    expect(convertToBase(1000000, "VND", rates)).toBe(1000000);
  });

  it("returns null when the rate is missing or invalid", () => {
    expect(rateFor("GBP", {})).toBeNull();
    expect(rateFor("GBP", { GBP: 0 })).toBeNull();
    expect(rateFor("GBP", { GBP: Number.NaN })).toBeNull();
    expect(convertFromBase(1000, "GBP", {})).toBeNull();
    expect(convertToBase(10, "GBP", {})).toBeNull();
  });

  it("rounds to the requested precision", () => {
    expect(roundToPrecision(10.0574, 2)).toBe(10.06);
    expect(roundToPrecision(10.4, 0)).toBe(10);
  });
});
