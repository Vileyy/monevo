import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth.store";
import type { CreateTransactionBody } from "@/types/api";

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
};

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  createTransaction: (payload: CreateTransactionBody) => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchTransactions: async () => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get<Transaction[]>("/transactions");
      set({ transactions: response.data });
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
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
  },
}));
