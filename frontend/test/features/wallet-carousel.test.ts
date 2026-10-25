import {
  clampSlideIndex,
  computeMonthlyFlows,
  slideIndexForOffset,
  walletIdForIndex,
  walletIndexForId,
} from "../../src/features/wallets/utils/wallet-carousel";

describe("Wallet carousel helpers", () => {
  const wallets = [{ id: "w1" }, { id: "w2" }, { id: "w3" }];

  it("maps the aggregate selection to the first slide", () => {
    expect(walletIndexForId(wallets, null)).toBe(0);
    expect(walletIdForIndex(wallets, 0)).toBeNull();
  });

  it("maps a wallet id to its slide after the aggregate slide", () => {
    expect(walletIndexForId(wallets, "w1")).toBe(1);
    expect(walletIndexForId(wallets, "w3")).toBe(3);
    expect(walletIdForIndex(wallets, 2)).toBe("w2");
  });

  it("falls back to the aggregate slide for stale ids and out-of-range indexes", () => {
    expect(walletIndexForId(wallets, "missing")).toBe(0);
    expect(walletIdForIndex(wallets, 9)).toBeNull();
    expect(walletIdForIndex([], 1)).toBeNull();
  });

  it("clamps slide indexes inside the slide range", () => {
    expect(clampSlideIndex(-2, 4)).toBe(0);
    expect(clampSlideIndex(2, 4)).toBe(2);
    expect(clampSlideIndex(9, 4)).toBe(3);
    expect(clampSlideIndex(1, 0)).toBe(0);
  });

  it("maps scroll offsets to the nearest slide", () => {
    expect(slideIndexForOffset(0, 400, 4)).toBe(0);
    expect(slideIndexForOffset(400, 400, 4)).toBe(1);
    expect(slideIndexForOffset(599, 400, 4)).toBe(1);
    expect(slideIndexForOffset(620, 400, 4)).toBe(2);
    expect(slideIndexForOffset(-50, 400, 4)).toBe(0);
    expect(slideIndexForOffset(5000, 400, 4)).toBe(3);
  });

  it("ignores offsets it cannot resolve", () => {
    expect(slideIndexForOffset(300, 0, 4)).toBe(0);
    expect(slideIndexForOffset(300, 400, 0)).toBe(0);
  });

  it("aggregates this month's income and expense per wallet", () => {
    const now = new Date("2026-10-25T12:00:00.000Z");
    const flows = computeMonthlyFlows(
      [
        {
          walletId: "w1",
          type: "INCOME",
          amount: 500,
          date: "2026-10-02T00:00:00.000Z",
        },
        {
          walletId: "w1",
          type: "EXPENSE",
          amount: 120,
          date: "2026-10-10T00:00:00.000Z",
        },
        {
          walletId: "w2",
          type: "EXPENSE",
          amount: 80,
          date: "2026-10-24T00:00:00.000Z",
        },
        {
          walletId: "w1",
          type: "INCOME",
          amount: 999,
          date: "2026-09-30T00:00:00.000Z",
        },
      ],
      now,
    );

    expect(flows.byWallet.w1).toEqual({ income: 500, expense: 120 });
    expect(flows.byWallet.w2).toEqual({ income: 0, expense: 80 });
    expect(flows.byWallet.w3).toBeUndefined();
    expect(flows.all).toEqual({ income: 500, expense: 200 });
  });

  it("returns zero totals when there are no transactions this month", () => {
    const flows = computeMonthlyFlows([], new Date("2026-10-25T12:00:00.000Z"));

    expect(flows.all).toEqual({ income: 0, expense: 0 });
    expect(flows.byWallet).toEqual({});
  });
});
