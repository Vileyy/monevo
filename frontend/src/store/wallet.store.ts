import { create } from "zustand";
import { apiClient } from "@/services/api/client";
import { useAuthStore } from "@/store/auth.store";

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: "CASH" | "BANK" | "CREDIT_CARD" | string;
  createdAt: string;
  updatedAt: string;
};

type WalletState = {
  wallets: Wallet[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchWallets: () => Promise<void>;
  createWallet: (
    name: string,
    type: string,
    balance: number,
  ) => Promise<Wallet>;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  isLoading: false,
  hasFetched: false,

  fetchWallets: async () => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get<Wallet[]>("/wallets");
      set({ wallets: response.data, hasFetched: true });
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
      set({ hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  createWallet: async (name, type, balance) => {
    const response = await apiClient.post<Wallet>("/wallets", {
      name,
      type,
      balance,
    });
    set({ wallets: [...get().wallets, response.data] });
    return response.data;
  },
}));
