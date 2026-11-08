import { create } from 'zustand';
import { CurrencyCode, DEFAULT_CURRENCY } from '@/lib/currencies';
import { getStorage, saveStorage } from '@/lib/persistent-storage';

const CURRENCY_KEY = 'monevo_settings_currency';
const HIDE_BALANCE_KEY = 'monevo_settings_hide_balance';
const NOTIFICATIONS_KEY = 'monevo_settings_reminder_notifications';
const ANALYTICS_KEY = 'monevo_settings_share_analytics';

interface SettingsState {
  currency: CurrencyCode;
  hideBalance: boolean;
  reminderNotifications: boolean;
  shareAnalytics: boolean;
  isHydrated: boolean;
  restoreSettings: () => Promise<void>;
  setCurrency: (currency: CurrencyCode) => void;
  setHideBalance: (hide: boolean) => void;
  toggleHideBalance: () => void;
  setReminderNotifications: (enabled: boolean) => void;
  toggleReminderNotifications: () => void;
  setShareAnalytics: (enabled: boolean) => void;
  toggleShareAnalytics: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: DEFAULT_CURRENCY,
  hideBalance: false,
  reminderNotifications: true,
  shareAnalytics: true,
  isHydrated: false,

  restoreSettings: async () => {
    try {
      const [
        savedCurrency,
        savedHideBalance,
        savedNotifications,
        savedAnalytics,
      ] = await Promise.all([
        getStorage(CURRENCY_KEY),
        getStorage(HIDE_BALANCE_KEY),
        getStorage(NOTIFICATIONS_KEY),
        getStorage(ANALYTICS_KEY),
      ]);

      set({
        currency: (savedCurrency as CurrencyCode) || DEFAULT_CURRENCY,
        hideBalance: savedHideBalance === 'true',
        reminderNotifications:
          savedNotifications === null ? true : savedNotifications === 'true',
        shareAnalytics:
          savedAnalytics === null ? true : savedAnalytics === 'true',
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

  setReminderNotifications: (enabled: boolean) => {
    void saveStorage(NOTIFICATIONS_KEY, String(enabled));
    set({ reminderNotifications: enabled });
  },

  toggleReminderNotifications: () => {
    const next = !get().reminderNotifications;
    void saveStorage(NOTIFICATIONS_KEY, String(next));
    set({ reminderNotifications: next });
  },

  setShareAnalytics: (enabled: boolean) => {
    void saveStorage(ANALYTICS_KEY, String(enabled));
    set({ shareAnalytics: enabled });
  },

  toggleShareAnalytics: () => {
    const next = !get().shareAnalytics;
    void saveStorage(ANALYTICS_KEY, String(next));
    set({ shareAnalytics: next });
  },
}));
