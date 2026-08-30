import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth.store";
import type { CreateTransactionBody, UpdateTransactionBody } from "@/types/api";

export type Transaction = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | string;
  note: string | null;
  date: string;
  walletId: string;
  categoryId: string;
  wallet?: { id: string; name: string; type: string };
  category?: { id: string; name: string; icon: string | null };
  createdAt?: string;
  updatedAt?: string;
};

export type TransactionQueryParams = {
  walletId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
};

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchTransactions: (query?: TransactionQueryParams) => Promise<void>;
  createTransaction: (payload: CreateTransactionBody) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    payload: UpdateTransactionBody,
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  hasFetched: false,

  fetchTransactions: async (query) => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get<Transaction[]>("/transactions", {
        params: query,
      });
      set({ transactions: response.data, hasFetched: true });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      set({ hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createTransaction: async (payload) => {
    const response = await apiClient.post<Transaction>(
      "/transactions",
      payload,
    );
    set({ transactions: [response.data, ...get().transactions] });
    return response.data;
  },

  updateTransaction: async (id, payload) => {
    const response = await apiClient.patch<Transaction>(
      `/transactions/${id}`,
      payload,
    );
    set({
      transactions: get().transactions.map((t) =>
        t.id === id ? response.data : t,
      ),
    });
    return response.data;
  },

  deleteTransaction: async (id) => {
    await apiClient.delete(`/transactions/${id}`);
    set({
      transactions: get().transactions.filter((t) => t.id !== id),
    });
  },
}));
