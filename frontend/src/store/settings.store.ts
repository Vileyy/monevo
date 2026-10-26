import { create } from 'zustand';
import { CurrencyCode, DEFAULT_CURRENCY } from '@/lib/currencies';
import { getStorage, saveStorage } from '@/lib/persistent-storage';

const CURRENCY_KEY = 'monevo_settings_currency';
const HIDE_BALANCE_KEY = 'monevo_settings_hide_balance';
const NOTIFICATIONS_KEY = 'monevo_settings_reminder_notifications';

interface SettingsState {
  currency: CurrencyCode;
  hideBalance: boolean;
  reminderNotifications: boolean;
  isHydrated: boolean;
  restoreSettings: () => Promise<void>;
  setCurrency: (currency: CurrencyCode) => void;
  setHideBalance: (hide: boolean) => void;
  toggleHideBalance: () => void;
  setReminderNotifications: (enabled: boolean) => void;
  toggleReminderNotifications: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: DEFAULT_CURRENCY,
  hideBalance: false,
  reminderNotifications: true,
  isHydrated: false,

  restoreSettings: async () => {
    try {
      const [savedCurrency, savedHideBalance, savedNotifications] =
        await Promise.all([
          getStorage(CURRENCY_KEY),
          getStorage(HIDE_BALANCE_KEY),
          getStorage(NOTIFICATIONS_KEY),
        ]);

      set({
        currency: (savedCurrency as CurrencyCode) || DEFAULT_CURRENCY,
        hideBalance: savedHideBalance === 'true',
        reminderNotifications:
          savedNotifications === null ? true : savedNotifications === 'true',
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
}));
