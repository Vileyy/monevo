import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  getCurrencyConfig,
} from "@/lib/currencies";

describe("currencies", () => {
  it("should have VND as default currency", () => {
    expect(DEFAULT_CURRENCY).toBe("VND");
  });

  it("should contain major world currencies", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("VND");
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("JPY");
    expect(codes).toContain("KRW");
    expect(codes).toContain("AUD");
    expect(codes).toContain("SGD");
  });

  it("should retrieve config by code", () => {
    const vnd = getCurrencyConfig("VND");
    expect(vnd.code).toBe("VND");
    expect(vnd.symbol).toBe("₫");
    expect(vnd.precision).toBe(0);

    const usd = getCurrencyConfig("USD");
    expect(usd.code).toBe("USD");
    expect(usd.symbol).toBe("$");
    expect(usd.precision).toBe(2);
  });

  it("should fallback to default currency for unknown code", () => {
    const fallback = getCurrencyConfig("UNKNOWN" as never);
    expect(fallback.code).toBe("VND");
  });
});
