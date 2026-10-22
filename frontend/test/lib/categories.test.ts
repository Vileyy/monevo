import {
  CATEGORY_PRESETS,
  DEFAULT_CATEGORY_METAS,
  getCategoryMeta,
  getWalletMeta,
} from "@/lib/categories";

const isFilled = (icon: string) => !icon.endsWith("-outline");

describe("category icon presets", () => {
  it("uses filled glyphs for every preset", () => {
    for (const [name, preset] of Object.entries(CATEGORY_PRESETS)) {
      expect(isFilled(preset.icon)).toBe(true);
      expect(preset.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(preset.bgColor).toMatch(/^#[0-9A-F]{6}$/i);
      expect(name.length).toBeGreaterThan(0);
    }
  });

  it("keeps English and Vietnamese aliases aligned", () => {
    const aliases: [string, string][] = [
      ["Food", "Ăn uống"],
      ["Transport", "Di chuyển"],
      ["Shopping", "Mua sắm"],
      ["Bills", "Hóa đơn"],
      ["Entertainment", "Giải trí"],
      ["Health", "Y tế"],
      ["Education", "Giáo dục"],
      ["Salary", "Lương"],
      ["Bonus", "Thưởng"],
      ["Investment", "Đầu tư"],
      ["Other income", "Thu khác"],
      ["Other", "Khác"],
    ];

    for (const [english, vietnamese] of aliases) {
      expect(CATEGORY_PRESETS[vietnamese]).toEqual(CATEGORY_PRESETS[english]);
    }
  });

  it("keeps default categories in sync with presets", () => {
    for (const meta of DEFAULT_CATEGORY_METAS) {
      const preset = CATEGORY_PRESETS[meta.name];
      expect(preset).toBeDefined();
      expect(meta.icon).toBe(preset.icon);
      expect(meta.color).toBe(preset.color);
      expect(meta.bgColor).toBe(preset.bgColor);
    }
  });
});

describe("getCategoryMeta", () => {
  it("returns the matching preset", () => {
    expect(getCategoryMeta("Food")).toEqual(CATEGORY_PRESETS.Food);
  });

  it("falls back by transaction type for blank names", () => {
    expect(getCategoryMeta(null, "INCOME").icon).toBe("cash");
    expect(getCategoryMeta(undefined, "EXPENSE").icon).toBe("cart");
  });

  it("falls back by transaction type for unknown names", () => {
    expect(getCategoryMeta("Side project", "INCOME").icon).toBe(
      "arrow-down-circle",
    );
    expect(getCategoryMeta("Side project", "EXPENSE").icon).toBe("pricetag");
  });

  it("uses filled glyphs for fallbacks", () => {
    const icons = [
      getCategoryMeta(null, "INCOME").icon,
      getCategoryMeta(null, "EXPENSE").icon,
      getCategoryMeta("Unknown", "INCOME").icon,
      getCategoryMeta("Unknown", "EXPENSE").icon,
    ];
    icons.forEach((icon) => expect(isFilled(icon)).toBe(true));
  });
});

describe("getWalletMeta", () => {
  it("maps each wallet type to a filled badge", () => {
    const cases = [
      { type: "BANK", icon: "business", label: "Bank Account" },
      { type: "CREDIT_CARD", icon: "card", label: "Credit Card" },
      { type: "CASH", icon: "cash", label: "Cash Wallet" },
    ];

    for (const expected of cases) {
      const meta = getWalletMeta(expected.type);
      expect(meta.icon).toBe(expected.icon);
      expect(meta.label).toBe(expected.label);
      expect(isFilled(meta.icon)).toBe(true);
    }
  });

  it("defaults unknown types to cash", () => {
    const meta = getWalletMeta("SAVINGS");
    expect(meta.icon).toBe("cash");
    expect(meta.label).toBe("Cash Wallet");
  });
});
