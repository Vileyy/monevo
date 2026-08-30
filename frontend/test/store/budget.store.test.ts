jest.mock("@/services/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from "@/services/api/client";
import { useBudgetStore } from "@/store/budget.store";

describe("budget.store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBudgetStore.setState({
      budgets: [],
      summary: {
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
      },
      selectedMonth: 8,
      selectedYear: 2026,
      isLoading: false,
      error: null,
    });
  });

  it("should initialize with default state", () => {
    const state = useBudgetStore.getState();
    expect(state.budgets).toEqual([]);
    expect(state.summary.totalBudget).toBe(0);
  });

  describe("fetchBudgets", () => {
    it("should fetch and set budgets data", async () => {
      const mockResponse = {
        data: {
          month: 8,
          year: 2026,
          summary: {
            totalBudget: 2000000,
            totalSpent: 500000,
            totalRemaining: 1500000,
            overallPercentage: 25,
          },
          items: [
            {
              id: "b1",
              amount: 2000000,
              month: 8,
              year: 2026,
              categoryId: "c1",
              category: { id: "c1", name: "Food", type: "EXPENSE", icon: null },
              spent: 500000,
              remaining: 1500000,
              percentage: 25,
            },
          ],
        },
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      await useBudgetStore.getState().fetchBudgets(8, 2026);

      const state = useBudgetStore.getState();
      expect(apiClient.get).toHaveBeenCalledWith("/budgets", {
        params: { month: 8, year: 2026 },
      });
      expect(state.budgets).toHaveLength(1);
      expect(state.summary.totalBudget).toBe(2000000);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("createOrUpdateBudget", () => {
    it("should call api post and reload budgets", async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "b1" } });
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          month: 8,
          year: 2026,
          summary: {
            totalBudget: 2000000,
            totalSpent: 0,
            totalRemaining: 2000000,
            overallPercentage: 0,
          },
          items: [],
        },
      });

      await useBudgetStore
        .getState()
        .createOrUpdateBudget("c1", 2000000, 8, 2026);

      expect(apiClient.post).toHaveBeenCalledWith("/budgets", {
        categoryId: "c1",
        amount: 2000000,
        month: 8,
        year: 2026,
      });
    });
  });

  describe("deleteBudget", () => {
    it("should call api delete and refresh budgets", async () => {
      (apiClient.delete as jest.Mock).mockResolvedValue({ data: { id: "b1" } });
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          month: 8,
          year: 2026,
          summary: {
            totalBudget: 0,
            totalSpent: 0,
            totalRemaining: 0,
            overallPercentage: 0,
          },
          items: [],
        },
      });

      await useBudgetStore.getState().deleteBudget("b1");

      expect(apiClient.delete).toHaveBeenCalledWith("/budgets/b1");
    });
  });
});
