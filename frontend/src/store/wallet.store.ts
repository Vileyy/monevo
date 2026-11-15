import { create } from 'zustand';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';
import { CreateWalletBody, UpdateWalletBody } from '@/types/api';

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  type: 'CASH' | 'BANK' | 'CREDIT_CARD' | string;
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
    balance?: number,
  ) => Promise<Wallet>;
  updateWallet: (id: string, data: UpdateWalletBody) => Promise<Wallet>;
  deleteWallet: (id: string) => Promise<void>;
};

// Screens share one store: when the startup prefetch and the Home screen ask
// at the same time, both should await the same request.
let walletsRequest: Promise<void> | null = null;

export const useWalletStore = create<WalletState>((set, get) => ({
  wallets: [],
  isLoading: false,
  hasFetched: false,

  fetchWallets: () => {
    const token = useAuthStore.getState().token;
    if (!token) return Promise.resolve();
    if (walletsRequest) return walletsRequest;

    walletsRequest = (async () => {
      set({ isLoading: true });
      try {
        const response = await apiClient.get<Wallet[]>('/wallets');
        // Ignore a late response from a session that already signed out.
        if (useAuthStore.getState().token === token) {
          set({ wallets: response.data, hasFetched: true });
        }
      } catch (error: any) {
        if (error?.response?.status !== 401) {
          console.error('Failed to fetch wallets:', error);
        }
        set({ hasFetched: true });
      } finally {
        set({ isLoading: false });
        walletsRequest = null;
      }
    })();

    return walletsRequest;
  },

  createWallet: async (name, type, balance = 0) => {
    const payload: CreateWalletBody = { name, type, balance };
    const response = await apiClient.post<Wallet>('/wallets', payload);
    set({ wallets: [response.data, ...get().wallets] });
    return response.data;
  },

  updateWallet: async (id, data) => {
    const response = await apiClient.patch<Wallet>(`/wallets/${id}`, data);
    set({
      wallets: get().wallets.map((w) => (w.id === id ? response.data : w)),
    });
    return response.data;
  },

  deleteWallet: async (id) => {
    await apiClient.delete(`/wallets/${id}`);
    set({
      wallets: get().wallets.filter((w) => w.id !== id),
    });
  },
}));
