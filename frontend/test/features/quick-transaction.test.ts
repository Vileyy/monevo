import {
  resolveCategoryId,
  resolveWalletId,
  validateQuickAmount,
} from "../../src/features/transactions/utils/quick-transaction";

describe("Quick transaction helpers", () => {
  const wallets = [{ id: "w1" }, { id: "w2" }];
  const categories = [
    { id: "c1", type: "EXPENSE" },
    { id: "c2", type: "EXPENSE" },
    { id: "c3", type: "INCOME" },
  ];

  it("keeps a valid selected wallet", () => {
    expect(resolveWalletId(wallets, "w2")).toBe("w2");
  });

  it("falls back to the first wallet when selection is stale", () => {
    expect(resolveWalletId(wallets, "missing")).toBe("w1");
    expect(resolveWalletId([], "w1")).toBeNull();
  });

  it("keeps a category only when it matches the transaction type", () => {
    expect(resolveCategoryId(categories, "c2", "EXPENSE")).toBe("c2");
    expect(resolveCategoryId(categories, "c3", "EXPENSE")).toBe("c1");
    expect(resolveCategoryId(categories, "c2", "INCOME")).toBe("c3");
  });

  it("returns null when no category matches the type", () => {
    expect(resolveCategoryId([{ id: "c1", type: "EXPENSE" }], null, "INCOME")).toBeNull();
  });

  it("rejects zero, negative, and non-finite amounts", () => {
    expect(validateQuickAmount(0)).not.toBeNull();
    expect(validateQuickAmount(-1000)).not.toBeNull();
    expect(validateQuickAmount(Number.NaN)).not.toBeNull();
    expect(validateQuickAmount(1000)).toBeNull();
  });
});
