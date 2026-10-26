import { create } from 'zustand';
import { apiClient } from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';
import type {
  CreateTransactionBody,
  Paginated,
  TransactionPageMeta,
  TransactionSummary,
  UpdateTransactionBody,
} from '@/types/api';

export type Transaction = {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | string;
  note: string | null;
  date: string;
  walletId: string;
  categoryId: string;
  wallet?: { id: string; name: string; type: string };
  category?: { id: string; name: string; icon: string | null };
  createdAt?: string;
  updatedAt?: string;
};

export type TransactionQueryParams = {
  walletId?: string;
  categoryId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

export const TRANSACTION_PAGE_SIZE = 20;

type TransactionState = {
  transactions: Transaction[];
  isLoading: boolean;
  hasFetched: boolean;
  pageMeta: TransactionPageMeta | null;
  summary: TransactionSummary | null;
  isLoadingMore: boolean;
  lastPageQuery: TransactionQueryParams | null;
  fetchTransactions: (query?: TransactionQueryParams) => Promise<void>;
  fetchTransactionsPage: (
    query?: TransactionQueryParams,
    options?: { append?: boolean },
  ) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  fetchTransactionSummary: (query?: TransactionQueryParams) => Promise<void>;
  createTransaction: (payload: CreateTransactionBody) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    payload: UpdateTransactionBody,
  ) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  hasFetched: false,
  pageMeta: null,
  summary: null,
  isLoadingMore: false,
  lastPageQuery: null,

  fetchTransactions: async (query) => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.get<Transaction[]>('/transactions', {
        params: query,
      });
      set({ transactions: response.data, hasFetched: true });
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch transactions:', error);
      }
      set({ hasFetched: true });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactionsPage: async (query = {}, { append = false } = {}) => {
    if (!useAuthStore.getState().token) return;

    set({ isLoading: !append, isLoadingMore: append });
    try {
      const page = append ? (get().pageMeta?.page ?? 1) + 1 : 1;
      const response = await apiClient.get<Paginated<Transaction>>(
        '/transactions',
        { params: { ...query, page, limit: TRANSACTION_PAGE_SIZE } },
      );
      const { data, meta } = response.data;
      set({
        transactions: append ? [...get().transactions, ...data] : data,
        pageMeta: meta,
        lastPageQuery: query,
        hasFetched: true,
      });
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch transactions page:', error);
      }
      if (!append) set({ hasFetched: true });
    } finally {
      set({ isLoading: false, isLoadingMore: false });
    }
  },

  loadMoreTransactions: async () => {
    const { pageMeta, isLoading, isLoadingMore, lastPageQuery } = get();
    if (!pageMeta?.hasMore || isLoading || isLoadingMore) return;
    await get().fetchTransactionsPage(lastPageQuery ?? {}, { append: true });
  },

  fetchTransactionSummary: async (query = {}) => {
    if (!useAuthStore.getState().token) return;

    try {
      const response = await apiClient.get<TransactionSummary>(
        '/transactions/summary',
        { params: query },
      );
      set({ summary: response.data });
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error('Failed to fetch transaction summary:', error);
      }
    }
  },

  createTransaction: async (payload) => {
    const response = await apiClient.post<Transaction>(
      '/transactions',
      payload,
    );
    set({ transactions: [response.data, ...get().transactions] });
    return response.data;
  },

  updateTransaction: async (id, payload) => {
    const response = await apiClient.patch<Transaction>(
      `/transactions/${id}`,
      payload,
    );
    set({
      transactions: get().transactions.map((t) =>
        t.id === id ? response.data : t,
      ),
    });
    return response.data;
  },

  deleteTransaction: async (id) => {
    await apiClient.delete(`/transactions/${id}`);
    set({
      transactions: get().transactions.filter((t) => t.id !== id),
    });
  },
}));
