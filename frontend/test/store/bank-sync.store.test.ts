import { useBankSyncStore } from '@/store/bank-sync.store';
import { useWalletStore } from '@/store/wallet.store';
import { useCategoryStore } from '@/store/category.store';
import { useTransactionStore } from '@/store/transaction.store';

jest.mock('@/lib/persistent-storage', () => ({
  getStorage: jest.fn().mockResolvedValue(null),
  saveStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest
    .fn()
    .mockResolvedValue('test-notification-id'),
  setNotificationHandler: jest.fn(),
}));

jest.mock('@/lib/haptics', () => ({
  hapticFeedback: {
    warning: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    light: jest.fn(),
  },
}));

describe('useBankSyncStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useBankSyncStore.setState({
      isEnabled: true,
      autoSave: true,
      defaultWalletId: null,
      pendingTransactions: [],
      isHydrated: true,
    });

    useWalletStore.setState({
      wallets: [
        {
          id: 'w_cash',
          name: 'Tiền mặt',
          type: 'CASH',
          balance: 500000,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'w_mb',
          name: 'MB Bank',
          type: 'BANK',
          balance: 10000000,
          createdAt: '',
          updatedAt: '',
        },
      ],
      isLoading: false,
      hasFetched: true,
    });

    useCategoryStore.setState({
      categories: [
        {
          id: 'c_food',
          name: 'Ăn uống',
          type: 'EXPENSE',
          icon: 'restaurant',
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'c_salary',
          name: 'Lương & Thưởng',
          type: 'INCOME',
          icon: 'cash',
          createdAt: '',
          updatedAt: '',
        },
      ],
      isLoading: false,
      hasFetched: true,
    });
  });

  it('initializes with default enabled and autoSave values', () => {
    const state = useBankSyncStore.getState();
    expect(state.isEnabled).toBe(true);
    expect(state.autoSave).toBe(true);
    expect(state.pendingTransactions).toEqual([]);
  });

  it('updates enable and autosave flags', () => {
    useBankSyncStore.getState().setEnabled(false);
    expect(useBankSyncStore.getState().isEnabled).toBe(false);

    useBankSyncStore.getState().setAutoSave(false);
    expect(useBankSyncStore.getState().autoSave).toBe(false);
  });

  describe('processNotification', () => {
    it('ignores notifications when disabled', async () => {
      useBankSyncStore.getState().setEnabled(false);
      const result = await useBankSyncStore.getState().processNotification({
        title: 'Vietcombank',
        text: 'TK 0011... | GD: -50,000VND | ND: Cafe',
      });
      expect(result).toBeNull();
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(0);
    });

    it('automatically matches MB Bank wallet and auto-saves transaction', async () => {
      const createTransactionMock = jest
        .fn()
        .mockResolvedValue({ id: 't_new' });
      useTransactionStore.setState({
        createTransaction: createTransactionMock,
      } as any);

      const result = await useBankSyncStore.getState().processNotification({
        title: 'MB Bank',
        text: 'TK 0381029381 GD: -80,000VND vao 16/11/26 18:30. So du: 8,220,000VND. Noi dung: An toi com tam',
        packageName: 'com.mbmobile',
      });

      expect(result).not.toBeNull();
      expect(result?.amount).toBe(80000);
      expect(result?.type).toBe('EXPENSE');

      expect(createTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 80000,
          type: 'EXPENSE',
          walletId: 'w_mb',
          categoryId: 'c_food',
        }),
      );
      // Automatically saved transactions do not linger in pending queue
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(0);
    });

    it('falls back to pending queue when autoSave is toggled off', async () => {
      useBankSyncStore.getState().setAutoSave(false);

      const result = await useBankSyncStore.getState().processNotification({
        title: 'MB Bank',
        text: 'TK 0381029381 GD: -50,000VND. So du: 8,170,000VND. Noi dung: Cafe',
        packageName: 'com.mbmobile',
      });

      expect(result).not.toBeNull();
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(1);
    });
  });

  describe('confirm and dismiss pending transactions', () => {
    it('confirms pending transaction and removes it from queue', async () => {
      useBankSyncStore.getState().setAutoSave(false);
      const createTransactionMock = jest
        .fn()
        .mockResolvedValue({ id: 't_new' });
      useTransactionStore.setState({
        createTransaction: createTransactionMock,
      } as any);

      const item = await useBankSyncStore.getState().processNotification({
        title: 'MoMo',
        text: 'Thanh toán thành công 42.000đ cho Circle K',
        packageName: 'com.mservice.momotransfer',
      });

      expect(item).not.toBeNull();
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(1);

      const confirmed = await useBankSyncStore
        .getState()
        .confirmPendingTransaction(item!.id);
      expect(confirmed).toBe(true);
      expect(createTransactionMock).toHaveBeenCalled();
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(0);
    });

    it('dismisses pending transaction without creating transaction', () => {
      useBankSyncStore.setState({
        pendingTransactions: [
          {
            id: 'item_1',
            bankCode: 'MB',
            bankName: 'MB Bank',
            amount: 50000,
            type: 'EXPENSE',
            note: 'Test',
            suggestedCategoryName: 'Ăn uống',
            timestamp: new Date().toISOString(),
            rawText: '',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      useBankSyncStore.getState().dismissPendingTransaction('item_1');
      expect(useBankSyncStore.getState().pendingTransactions).toHaveLength(0);
    });
  });
});
