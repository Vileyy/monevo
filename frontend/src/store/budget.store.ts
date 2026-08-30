import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { Category } from "./category.store";

export interface BudgetItem {
  id: string;
  amount: number;
  month: number;
  year: number;
  categoryId: string;
  category: Category;
  spent: number;
  remaining: number;
  percentage: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
}

interface BudgetResponse {
  month: number;
  year: number;
  summary: BudgetSummary;
  items: BudgetItem[];
}

interface BudgetState {
  budgets: BudgetItem[];
  summary: BudgetSummary;
  selectedMonth: number;
  selectedYear: number;
  isLoading: boolean;
  error: string | null;
  fetchBudgets: (month?: number, year?: number) => Promise<void>;
  createOrUpdateBudget: (
    categoryId: string,
    amount: number,
    month?: number,
    year?: number,
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  setSelectedDate: (month: number, year: number) => void;
}

const now = new Date();

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  summary: {
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  },
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),
  isLoading: false,
  error: null,

  fetchBudgets: async (month, year) => {
    const targetMonth = month || get().selectedMonth;
    const targetYear = year || get().selectedYear;

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<BudgetResponse>("/budgets", {
        params: {
          month: targetMonth,
          year: targetYear,
        },
      });

      set({
        budgets: response.data.items,
        summary: response.data.summary,
        selectedMonth: response.data.month,
        selectedYear: response.data.year,
        isLoading: false,
      });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load budgets",
      });
    }
  },

  createOrUpdateBudget: async (categoryId, amount, month, year) => {
    const targetMonth = month || get().selectedMonth;
    const targetYear = year || get().selectedYear;

    set({ isLoading: true, error: null });
    try {
      await apiClient.post("/budgets", {
        categoryId,
        amount,
        month: targetMonth,
        year: targetYear,
      });

      await get().fetchBudgets(targetMonth, targetYear);
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  deleteBudget: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/budgets/${id}`);
      await get().fetchBudgets(get().selectedMonth, get().selectedYear);
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedDate: (month, year) => {
    set({ selectedMonth: month, selectedYear: year });
    void get().fetchBudgets(month, year);
  },
}));
