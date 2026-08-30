import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { CurrencyCode, DEFAULT_CURRENCY } from "@/lib/currencies";

const CURRENCY_KEY = "monevo_settings_currency";
const HIDE_BALANCE_KEY = "monevo_settings_hide_balance";

async function saveStorage(key: string, value: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  }
}

async function getStorage(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }
}

interface SettingsState {
  currency: CurrencyCode;
  hideBalance: boolean;
  isHydrated: boolean;
  restoreSettings: () => Promise<void>;
  setCurrency: (currency: CurrencyCode) => void;
  setHideBalance: (hide: boolean) => void;
  toggleHideBalance: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: DEFAULT_CURRENCY,
  hideBalance: false,
  isHydrated: false,

  restoreSettings: async () => {
    try {
      const [savedCurrency, savedHideBalance] = await Promise.all([
        getStorage(CURRENCY_KEY),
        getStorage(HIDE_BALANCE_KEY),
      ]);

      set({
        currency: (savedCurrency as CurrencyCode) || DEFAULT_CURRENCY,
        hideBalance: savedHideBalance === "true",
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setCurrency: (currency: CurrencyCode) => {
    void saveStorage(CURRENCY_KEY, currency);
    set({ currency });
  },

  setHideBalance: (hideBalance: boolean) => {
    void saveStorage(HIDE_BALANCE_KEY, String(hideBalance));
    set({ hideBalance });
  },

  toggleHideBalance: () => {
    const next = !get().hideBalance;
    void saveStorage(HIDE_BALANCE_KEY, String(next));
    set({ hideBalance: next });
  },
}));
