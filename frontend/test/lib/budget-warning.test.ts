import {
  calculateBudgetWarning,
  isBudgetOverspent,
} from "@/lib/budget-warning";
import { BudgetItem } from "@/store/budget.store";

describe("budget-warning lib", () => {
  const sampleBudget: BudgetItem = {
    id: "b-1",
    amount: 1000000,
    month: 10,
    year: 2026,
    categoryId: "cat-food",
    category: {
      id: "cat-food",
      name: "Food & Dining",
      type: "EXPENSE",
      icon: "fast-food",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    spent: 600000,
    remaining: 400000,
    percentage: 60,
  };

  describe("calculateBudgetWarning", () => {
    it("should return NONE when budget is undefined or null", () => {
      const res = calculateBudgetWarning(undefined, 200000);
      expect(res.status).toBe("NONE");
      expect(res.projectedSpent).toBe(0);
      expect(res.overAmount).toBe(0);
    });

    it("should return NONE when budget amount is zero or negative", () => {
      const zeroBudget: BudgetItem = {
        ...sampleBudget,
        amount: 0,
      };
      const res = calculateBudgetWarning(zeroBudget, 200000);
      expect(res.status).toBe("NONE");
    });

    it("should return OK when projected spending is below 80%", () => {
      // 600k spent + 100k = 700k / 1M = 70%
      const res = calculateBudgetWarning(sampleBudget, 100000);
      expect(res.status).toBe("OK");
      expect(res.projectedSpent).toBe(700000);
      expect(res.projectedRemaining).toBe(300000);
      expect(res.projectedPercentage).toBe(70);
      expect(res.overAmount).toBe(0);
      expect(res.message).toContain("Remaining budget after this expense");
    });

    it("should return WARNING when projected spending reaches or exceeds 80% but does not exceed 100%", () => {
      // 600k spent + 250k = 850k / 1M = 85%
      const res = calculateBudgetWarning(sampleBudget, 250000);
      expect(res.status).toBe("WARNING");
      expect(res.projectedSpent).toBe(850000);
      expect(res.projectedRemaining).toBe(150000);
      expect(res.projectedPercentage).toBe(85);
      expect(res.overAmount).toBe(0);
      expect(res.message).toContain("will use 85% of your monthly budget");
    });

    it("should return EXCEEDED when projected spending exceeds 100%", () => {
      // 600k spent + 500k = 1.1M / 1M = 110% (over by 100k)
      const res = calculateBudgetWarning(sampleBudget, 500000);
      expect(res.status).toBe("EXCEEDED");
      expect(res.projectedSpent).toBe(1100000);
      expect(res.projectedRemaining).toBe(-100000);
      expect(res.projectedPercentage).toBe(110);
      expect(res.overAmount).toBe(100000);
      expect(res.message).toContain("exceeds your remaining budget");
    });

    it("should return EXCEEDED and appropriate message when budget was already over limit", () => {
      const overBudget: BudgetItem = {
        ...sampleBudget,
        spent: 1200000,
        remaining: -200000,
        percentage: 120,
      };
      // Already spent 1.2M / 1M. Adding 100k makes 1.3M (over by 300k).
      const res = calculateBudgetWarning(overBudget, 100000);
      expect(res.status).toBe("EXCEEDED");
      expect(res.projectedSpent).toBe(1300000);
      expect(res.overAmount).toBe(300000);
      expect(res.message).toContain("already over budget");
    });

    it("should handle 0 expense amount correctly", () => {
      const res = calculateBudgetWarning(sampleBudget, 0);
      expect(res.status).toBe("OK");
      expect(res.projectedSpent).toBe(600000);
      expect(res.projectedRemaining).toBe(400000);
      expect(res.projectedPercentage).toBe(60);
    });

    it("should handle negative expense amount by treating it as 0", () => {
      const res = calculateBudgetWarning(sampleBudget, -50000);
      expect(res.status).toBe("OK");
      expect(res.projectedSpent).toBe(600000);
    });
  });

  describe("isBudgetOverspent", () => {
    it("should return false when budget is null or undefined", () => {
      expect(isBudgetOverspent(null, 100000)).toBe(false);
      expect(isBudgetOverspent(undefined, 100000)).toBe(false);
    });

    it("should return false when expense fits within budget", () => {
      expect(isBudgetOverspent(sampleBudget, 300000)).toBe(false);
      expect(isBudgetOverspent(sampleBudget, 400000)).toBe(false);
    });

    it("should return true when expense exceeds budget limit", () => {
      expect(isBudgetOverspent(sampleBudget, 400001)).toBe(true);
      expect(isBudgetOverspent(sampleBudget, 1000000)).toBe(true);
    });

    it("should return true if budget was already exceeded even with 0 expense", () => {
      const overBudget: BudgetItem = {
        ...sampleBudget,
        spent: 1100000,
        remaining: -100000,
      };
      expect(isBudgetOverspent(overBudget, 0)).toBe(true);
    });
  });
});
