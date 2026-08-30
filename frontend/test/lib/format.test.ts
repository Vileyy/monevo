import {
  categoryDisplayName,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  walletTypeLabel,
} from "@/lib/format";

describe("format utilities", () => {
  describe("formatCurrency", () => {
    it("should format VND correctly", () => {
      const formatted = formatCurrency(150000, "VND");
      expect(formatted).toBe("150.000 ₫");
    });

    it("should format USD correctly", () => {
      const formatted = formatCurrency(1234.56, "USD");
      expect(formatted).toBe("$1,234.56");
    });

    it("should format EUR correctly", () => {
      const formatted = formatCurrency(50.5, "EUR");
      expect(formatted).toBe("€50,50");
    });

    it("should format JPY correctly", () => {
      const formatted = formatCurrency(2500, "JPY");
      expect(formatted).toBe("¥2,500");
    });
  });

  describe("parseCurrencyInput", () => {
    it("should parse integer amounts for VND", () => {
      expect(parseCurrencyInput("150.000", "VND")).toBe(150000);
      expect(parseCurrencyInput("", "VND")).toBe(0);
    });

    it("should parse float amounts for USD", () => {
      expect(parseCurrencyInput("123.45", "USD")).toBe(123.45);
      expect(parseCurrencyInput("", "USD")).toBe(0);
    });
  });

  describe("formatCurrencyInput", () => {
    it("should format integer inputs for VND", () => {
      expect(formatCurrencyInput("100000", "VND")).toBe("100.000");
    });

    it("should clean float inputs for USD", () => {
      expect(formatCurrencyInput("123.45", "USD")).toBe("123.45");
    });
  });

  describe("walletTypeLabel", () => {
    it("should return human readable labels", () => {
      expect(walletTypeLabel("CASH")).toBe("Cash");
      expect(walletTypeLabel("BANK")).toBe("Bank");
      expect(walletTypeLabel("CREDIT_CARD")).toBe("Card");
      expect(walletTypeLabel("OTHER")).toBe("OTHER");
    });
  });

  describe("categoryDisplayName", () => {
    it("should translate known categories and fallback to original", () => {
      expect(categoryDisplayName("Ăn uống")).toBe("Food");
      expect(categoryDisplayName("Di chuyển")).toBe("Transport");
      expect(categoryDisplayName("Lương")).toBe("Salary");
      expect(categoryDisplayName("Custom Category")).toBe("Custom Category");
    });
  });
});
