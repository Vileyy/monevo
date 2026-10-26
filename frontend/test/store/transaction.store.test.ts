import { apiClient } from '@/services/api/client';
import {
  TRANSACTION_PAGE_SIZE,
  useTransactionStore,
} from '@/store/transaction.store';

jest.mock('@/services/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@/store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ token: 'test-token' }),
  },
}));

const baseState = {
  transactions: [],
  isLoading: false,
  hasFetched: false,
  pageMeta: null,
  summary: null,
  isLoadingMore: false,
  lastPageQuery: null,
};

describe('transaction.store', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTransactionStore.setState(baseState);
  });

  describe('fetchTransactionsPage', () => {
    it('should fetch page 1 and set transactions + meta', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: [{ id: 't1', amount: 100 }],
          meta: {
            page: 1,
            limit: 20,
            total: 30,
            totalPages: 2,
            hasMore: true,
          },
        },
      });

      await useTransactionStore
        .getState()
        .fetchTransactionsPage({ type: 'EXPENSE' });

      expect(apiClient.get).toHaveBeenCalledWith('/transactions', {
        params: { type: 'EXPENSE', page: 1, limit: TRANSACTION_PAGE_SIZE },
      });
      const state = useTransactionStore.getState();
      expect(state.transactions).toEqual([{ id: 't1', amount: 100 }]);
      expect(state.pageMeta?.total).toBe(30);
      expect(state.lastPageQuery).toEqual({ type: 'EXPENSE' });
      expect(state.isLoading).toBe(false);
    });

    it('should append next page when append is true', async () => {
      useTransactionStore.setState({
        transactions: [
          {
            id: 't1',
            amount: 100,
            type: 'EXPENSE',
            note: null,
            date: '2026-10-20T00:00:00.000Z',
            walletId: 'w1',
            categoryId: 'c1',
          },
        ],
        lastPageQuery: { search: 'coffee' },
        pageMeta: {
          page: 1,
          limit: 20,
          total: 30,
          totalPages: 2,
          hasMore: true,
        },
      });
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: [{ id: 't2', amount: 200 }],
          meta: {
            page: 2,
            limit: 20,
            total: 30,
            totalPages: 2,
            hasMore: false,
          },
        },
      });

      await useTransactionStore
        .getState()
        .fetchTransactionsPage({ search: 'coffee' }, { append: true });

      expect(apiClient.get).toHaveBeenCalledWith('/transactions', {
        params: { search: 'coffee', page: 2, limit: TRANSACTION_PAGE_SIZE },
      });
      const state = useTransactionStore.getState();
      expect(state.transactions.map((t) => t.id)).toEqual(['t1', 't2']);
      expect(state.pageMeta?.hasMore).toBe(false);
    });
  });

  describe('loadMoreTransactions', () => {
    it('should do nothing when there is no more page', async () => {
      useTransactionStore.setState({
        pageMeta: {
          page: 1,
          limit: 20,
          total: 5,
          totalPages: 1,
          hasMore: false,
        },
      });

      await useTransactionStore.getState().loadMoreTransactions();

      expect(apiClient.get).not.toHaveBeenCalled();
    });

    it('should fetch the next page using the last query', async () => {
      useTransactionStore.setState({
        lastPageQuery: { walletId: 'w1' },
        pageMeta: {
          page: 1,
          limit: 20,
          total: 40,
          totalPages: 2,
          hasMore: true,
        },
      });
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: {
          data: [],
          meta: {
            page: 2,
            limit: 20,
            total: 40,
            totalPages: 2,
            hasMore: false,
          },
        },
      });

      await useTransactionStore.getState().loadMoreTransactions();

      expect(apiClient.get).toHaveBeenCalledWith('/transactions', {
        params: { walletId: 'w1', page: 2, limit: TRANSACTION_PAGE_SIZE },
      });
    });
  });

  describe('fetchTransactionSummary', () => {
    it('should fetch aggregated totals with the same filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        data: { totalIncome: 500, totalExpense: 200, count: 7 },
      });

      await useTransactionStore
        .getState()
        .fetchTransactionSummary({ type: 'INCOME' });

      expect(apiClient.get).toHaveBeenCalledWith('/transactions/summary', {
        params: { type: 'INCOME' },
      });
      expect(useTransactionStore.getState().summary).toEqual({
        totalIncome: 500,
        totalExpense: 200,
        count: 7,
      });
    });
  });
});
