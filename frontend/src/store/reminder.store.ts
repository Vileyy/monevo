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
    const prevReminders = get().reminders;
    // Optimistic update: mark as paid immediately
    set({
      reminders: prevReminders.map((r) =>
        r.id === id
          ? {
              ...r,
              isPaidThisMonth: true,
              status: "PAID" as ReminderStatus,
              lastPaidAt: new Date().toISOString(),
            }
          : r,
      ),
      error: null,
    });

    try {
      await apiClient.post(`/reminders/${id}/pay`, { walletId });
      // Refresh reminders, wallets & transactions in background
      await Promise.all([
        get().fetchReminders(),
        useWalletStore.getState().fetchWallets(),
        useTransactionStore.getState().fetchTransactions(),
      ]);
    } catch (err: unknown) {
      // Revert optimistic update
      set({ reminders: prevReminders, isLoading: false });
      throw err;
    }
  },

  deleteReminder: async (id) => {
    const prevReminders = get().reminders;
    // Optimistic deletion
    set({
      reminders: prevReminders.filter((r) => r.id !== id),
      error: null,
    });

    try {
      await apiClient.delete(`/reminders/${id}`);
    } catch (err: unknown) {
      // Revert if failed
      set({ reminders: prevReminders, isLoading: false });
      throw err;
    }
  },
}));
