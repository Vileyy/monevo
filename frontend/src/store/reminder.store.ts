import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { Wallet, useWalletStore } from "./wallet.store";
import { useTransactionStore } from "./transaction.store";

export type ReminderCategory =
  | "MEDICINE"
  | "ELECTRICITY"
  | "WATER"
  | "RENT"
  | "INTERNET"
  | "PHONE"
  | "OTHER";

export type ReminderStatus =
  "PAID" | "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "UPCOMING";

export interface ReminderItem {
  id: string;
  title: string;
  amount: number;
  dueDate: number;
  frequency: string;
  category?: ReminderCategory;
  lastPaidAt?: string | null;
  walletId?: string | null;
  wallet?: Wallet | null;
  isPaidThisMonth: boolean;
  daysUntilDue: number;
  status: ReminderStatus;
  createdAt?: string;
  updatedAt?: string;
}

interface ReminderState {
  reminders: ReminderItem[];
  isLoading: boolean;
  error: string | null;
  fetchReminders: () => Promise<void>;
  createReminder: (data: {
    title: string;
    amount: number;
    dueDate: number;
    category?: string;
    walletId?: string;
  }) => Promise<void>;
  payReminder: (id: string, walletId?: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,
  error: null,

  fetchReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<ReminderItem[]>("/reminders");
      set({ reminders: response.data, isLoading: false });
    } catch (err: unknown) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load reminders",
      });
    }
  },

  createReminder: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post("/reminders", data);
      await get().fetchReminders();
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  payReminder: async (id, walletId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.post(`/reminders/${id}/pay`, { walletId });
      // Refresh reminders, wallets & transactions
      await Promise.all([
        get().fetchReminders(),
        useWalletStore.getState().fetchWallets(),
        useTransactionStore.getState().fetchTransactions(),
      ]);
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },

  deleteReminder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/reminders/${id}`);
      set({
        reminders: get().reminders.filter((r) => r.id !== id),
        isLoading: false,
      });
    } catch (err: unknown) {
      set({ isLoading: false });
      throw err;
    }
  },
}));
