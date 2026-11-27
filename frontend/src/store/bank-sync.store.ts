import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getStorage, saveStorage } from '@/lib/persistent-storage';
import { useWalletStore, Wallet } from '@/store/wallet.store';
import { useCategoryStore } from '@/store/category.store';
import { useTransactionStore } from '@/store/transaction.store';
import { formatCurrency } from '@/lib/format';
import { hapticFeedback } from '@/lib/haptics';
import type {
  PendingBankTransaction,
  RawNotificationPayload,
} from '@/features/bank-sync/types';
import { parseBankNotification } from '@/features/bank-sync/utils/bankParsers';

const BANK_SYNC_ENABLED_KEY = 'monevo_bank_sync_enabled';
const BANK_SYNC_AUTOSAVE_KEY = 'monevo_bank_sync_auto_save';
const BANK_SYNC_MAPPINGS_KEY = 'monevo_bank_sync_mappings';
const BANK_SYNC_DEFAULT_WALLET_KEY = 'monevo_bank_sync_default_wallet';
const BANK_SYNC_PENDING_KEY = 'monevo_bank_sync_pending';

interface BankSyncState {
  isEnabled: boolean;
  autoSave: boolean;
  defaultWalletId: string | null;
  bankWalletMappings: Record<string, string>;
  pendingTransactions: PendingBankTransaction[];
  isHydrated: boolean;

  restoreBankSyncSettings: () => Promise<void>;
  setEnabled: (enabled: boolean) => void;
  setAutoSave: (autoSave: boolean) => void;
  setDefaultWalletId: (walletId: string | null) => void;
  setBankWalletMapping: (bankCode: string, walletId: string | null) => void;
  processNotification: (
    payload: RawNotificationPayload,
  ) => Promise<PendingBankTransaction | null>;
  confirmPendingTransaction: (
    id: string,
    overrides?: {
      walletId?: string;
      categoryId?: string;
      note?: string;
      amount?: number;
    },
  ) => Promise<boolean>;
  dismissPendingTransaction: (id: string) => void;
  clearAllPending: () => void;
  simulateNotification: (
    sampleText: string,
    title?: string,
    packageName?: string,
  ) => Promise<PendingBankTransaction | null>;
}

/**
 * Smart automatic wallet selector:
 * 1. Checks if any existing wallet name contains the bank name/acronym (e.g. "MB", "Techcombank", "VCB")
 * 2. If not, picks the first BANK wallet
 * 3. If not, picks the first available wallet
 * 4. If user has no wallets at all, automatically creates one for this bank!
 */
async function resolveOrCreateWalletForBank(
  bankCode: string,
  bankName: string,
): Promise<string | null> {
  let wallets = useWalletStore.getState().wallets;

  if (wallets.length === 0) {
    try {
      await useWalletStore.getState().fetchWallets();
      wallets = useWalletStore.getState().wallets;
    } catch {}
  }

  const bankKeywords: Record<string, string[]> = {
    MB: ['mb', 'mbbank', 'mb bank', 'quân đội', 'quan doi'],
    TCB: ['techcom', 'techcombank', 'tcb'],
    VCB: ['vietcom', 'vietcombank', 'vcb'],
    VPB: ['vpbank', 'vpb', 'vp'],
    ACB: ['acb'],
    TPB: ['tpbank', 'tpb', 'tiên phong', 'tien phong'],
    BIDV: ['bidv'],
    CTG: ['vietin', 'vietinbank', 'ipay'],
    MOMO: ['momo', 'ví momo'],
    ZALOPAY: ['zalopay', 'zalo pay', 'zalo'],
  };

  const keywords = bankKeywords[bankCode] || [bankName.toLowerCase()];

  // 1. Try finding a wallet with matching name
  const nameMatchedWallet = wallets.find((w: Wallet) => {
    const wName = w.name.toLowerCase();
    return keywords.some((kw) => wName.includes(kw));
  });

  if (nameMatchedWallet) {
    return nameMatchedWallet.id;
  }

  // 2. Try finding any wallet of type BANK
  const bankTypeWallet = wallets.find((w: Wallet) => w.type === 'BANK');
  if (bankTypeWallet) {
    return bankTypeWallet.id;
  }

  // 3. Auto-create a dedicated BANK wallet so bank transfers never deduct from Cash/Credit
  try {
    const newWallet = await useWalletStore
      .getState()
      .createWallet(bankName, 'BANK', 0);
    return newWallet.id;
  } catch (err) {
    console.warn('Failed to auto-create wallet for bank notification:', err);
  }

  // 4. Last-resort fallback to first available wallet
  if (wallets.length > 0) {
    return wallets[0].id;
  }

  return null;
}

/**
 * Smart automatic category selector:
 * Finds matching category for suggestedCategoryName and type (INCOME/EXPENSE)
 */
async function resolveCategoryForTransaction(
  suggestedCategoryName: string,
  type: 'INCOME' | 'EXPENSE',
): Promise<string | null> {
  let categories = useCategoryStore.getState().categories;

  if (categories.length === 0) {
    try {
      await useCategoryStore.getState().fetchCategories();
      categories = useCategoryStore.getState().categories;
    } catch {}
  }

  const sameTypeCategories = categories.filter((c) => c.type === type);

  // Exact or contains match
  const matched =
    sameTypeCategories.find(
      (c) =>
        c.name.toLowerCase() === suggestedCategoryName.toLowerCase() ||
        c.name.toLowerCase().includes(suggestedCategoryName.toLowerCase()) ||
        suggestedCategoryName.toLowerCase().includes(c.name.toLowerCase()),
    ) || sameTypeCategories[0];

  if (matched) {
    return matched.id;
  }

  // If no category exists of that type, try auto-creating default category
  try {
    const created = await useCategoryStore
      .getState()
      .createCategory(
        suggestedCategoryName,
        type,
        type === 'INCOME' ? 'cash' : 'cart',
      );
    return created.id;
  } catch {
    return categories[0]?.id || null;
  }
}

const recentSignatures = new Map<string, number>();
const DEDUP_WINDOW_MS = 30_000;

function isDuplicateNotification(
  bankCode: string,
  amount: number,
  type: string,
  rawText: string,
): boolean {
  const now = Date.now();
  const key = `${bankCode}|${type}|${amount}|${rawText.trim()}`;
  const prev = recentSignatures.get(key);
  if (prev !== undefined && now - prev < DEDUP_WINDOW_MS) {
    return true;
  }
  recentSignatures.set(key, now);
  return false;
}

export const useBankSyncStore = create<BankSyncState>((set, get) => ({
  // Default to true as requested: automatic and active out of the box
  isEnabled: true,
  autoSave: true,
  defaultWalletId: null,
  bankWalletMappings: {},
  pendingTransactions: [],
  isHydrated: false,

  restoreBankSyncSettings: async () => {
    try {
      const [
        savedEnabled,
        savedAutoSave,
        savedMappings,
        savedDefaultWallet,
        savedPending,
      ] = await Promise.all([
        getStorage(BANK_SYNC_ENABLED_KEY),
        getStorage(BANK_SYNC_AUTOSAVE_KEY),
        getStorage(BANK_SYNC_MAPPINGS_KEY),
        getStorage(BANK_SYNC_DEFAULT_WALLET_KEY),
        getStorage(BANK_SYNC_PENDING_KEY),
      ]);

      let parsedMappings: Record<string, string> = {};
      if (savedMappings) {
        try {
          parsedMappings = JSON.parse(savedMappings);
        } catch {}
      }

      let parsedPending: PendingBankTransaction[] = [];
      if (savedPending) {
        try {
          parsedPending = JSON.parse(savedPending);
        } catch {}
      }

      set({
        // Default to true if not explicitly set to 'false'
        isEnabled: savedEnabled === null ? true : savedEnabled === 'true',
        autoSave: savedAutoSave === null ? true : savedAutoSave === 'true',
        bankWalletMappings: parsedMappings,
        defaultWalletId: savedDefaultWallet || null,
        pendingTransactions: parsedPending,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  setEnabled: (enabled: boolean) => {
    void saveStorage(BANK_SYNC_ENABLED_KEY, String(enabled));
    set({ isEnabled: enabled });
  },

  setAutoSave: (autoSave: boolean) => {
    void saveStorage(BANK_SYNC_AUTOSAVE_KEY, String(autoSave));
    set({ autoSave });
  },

  setDefaultWalletId: (walletId: string | null) => {
    if (walletId) {
      void saveStorage(BANK_SYNC_DEFAULT_WALLET_KEY, walletId);
    } else {
      void saveStorage(BANK_SYNC_DEFAULT_WALLET_KEY, '');
    }
    set({ defaultWalletId: walletId });
  },

  setBankWalletMapping: (bankCode: string, walletId: string | null) => {
    const current = { ...get().bankWalletMappings };
    if (walletId) {
      current[bankCode] = walletId;
    } else {
      delete current[bankCode];
    }
    void saveStorage(BANK_SYNC_MAPPINGS_KEY, JSON.stringify(current));
    set({ bankWalletMappings: current });
  },

  processNotification: async (payload: RawNotificationPayload) => {
    const { isEnabled, autoSave, bankWalletMappings } = get();
    if (!isEnabled) return null;

    const parsed = parseBankNotification(
      payload.title,
      payload.text,
      payload.packageName,
    );
    if (!parsed) return null;

    if (
      isDuplicateNotification(
        parsed.bankCode,
        parsed.amount,
        parsed.type,
        parsed.rawText,
      )
    ) {
      return null;
    }

    // Check if user explicitly mapped this bank; otherwise auto-resolve
    let targetWalletId = bankWalletMappings[parsed.bankCode] || null;
    if (!targetWalletId) {
      targetWalletId = await resolveOrCreateWalletForBank(
        parsed.bankCode,
        parsed.bankName,
      );
    }

    // Automatically resolve category
    const targetCategoryId = await resolveCategoryForTransaction(
      parsed.suggestedCategoryName,
      parsed.type,
    );

    const pendingItem: PendingBankTransaction = {
      ...parsed,
      targetWalletId,
      targetCategoryId,
      createdAt: new Date().toISOString(),
    };

    // If autoSave is enabled and we have valid wallet and category:
    if (autoSave && targetWalletId && targetCategoryId) {
      try {
        await useTransactionStore.getState().createTransaction({
          amount: parsed.amount,
          type: parsed.type,
          walletId: targetWalletId,
          categoryId: targetCategoryId,
          note: parsed.note,
        });

        // Automatically update wallet balance in store
        void useWalletStore.getState().fetchWallets();
        void useTransactionStore.getState().fetchTransactions();

        // Local push notification acknowledging automatic record
        if (Platform.OS !== 'web') {
          const sign = parsed.type === 'INCOME' ? '+' : '-';
          const formatted = formatCurrency(parsed.amount);
          void Notifications.scheduleNotificationAsync({
            content: {
              title: `💸 ${parsed.bankName}: ${sign}${formatted}`,
              body: `${parsed.note} (Số dư ví đã tự động cập nhật)`,
              data: { type: 'BANK_SYNC_AUTOSAVE', id: pendingItem.id },
            },
            trigger: null,
          });
        }

        return pendingItem;
      } catch (err) {
        console.warn(
          'Failed to auto-save transaction, fallback to pending:',
          err,
        );
      }
    }

    // Fallback to pending queue if autoSave failed
    const updatedPending = [pendingItem, ...get().pendingTransactions];
    set({ pendingTransactions: updatedPending });
    void saveStorage(BANK_SYNC_PENDING_KEY, JSON.stringify(updatedPending));

    hapticFeedback.warning();

    return pendingItem;
  },

  confirmPendingTransaction: async (id, overrides = {}) => {
    const item = get().pendingTransactions.find((p) => p.id === id);
    if (!item) return false;

    const targetWalletId = overrides.walletId || item.targetWalletId;
    const targetCategoryId = overrides.categoryId || item.targetCategoryId;
    const amount = overrides.amount ?? item.amount;
    const note = overrides.note !== undefined ? overrides.note : item.note;

    if (!targetWalletId || !targetCategoryId) {
      return false;
    }

    try {
      await useTransactionStore.getState().createTransaction({
        amount,
        type: item.type,
        walletId: targetWalletId,
        categoryId: targetCategoryId,
        note,
      });

      void useWalletStore.getState().fetchWallets();
      void useTransactionStore.getState().fetchTransactions();
      get().dismissPendingTransaction(id);
      hapticFeedback.success();
      return true;
    } catch (err) {
      console.error('Failed to confirm bank transaction:', err);
      hapticFeedback.error();
      return false;
    }
  },

  dismissPendingTransaction: (id: string) => {
    const updated = get().pendingTransactions.filter((p) => p.id !== id);
    set({ pendingTransactions: updated });
    void saveStorage(BANK_SYNC_PENDING_KEY, JSON.stringify(updated));
  },

  clearAllPending: () => {
    set({ pendingTransactions: [] });
    void saveStorage(BANK_SYNC_PENDING_KEY, JSON.stringify([]));
  },

  simulateNotification: async (
    sampleText,
    title = 'Thông báo ngân hàng',
    packageName,
  ) => {
    return get().processNotification({
      title,
      text: sampleText,
      packageName,
      timestamp: Date.now(),
    });
  },
}));
