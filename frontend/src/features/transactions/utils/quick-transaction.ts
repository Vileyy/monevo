export type QuickTransactionType = 'INCOME' | 'EXPENSE';

export function resolveWalletId<T extends { id: string }>(
  wallets: T[],
  walletId: string | null,
): string | null {
  if (walletId && wallets.some((wallet) => wallet.id === walletId)) {
    return walletId;
  }
  return wallets[0]?.id ?? null;
}

export function resolveCategoryId<T extends { id: string; type: string }>(
  categories: T[],
  categoryId: string | null,
  type: QuickTransactionType,
): string | null {
  const matching = categories.filter((category) => category.type === type);
  if (categoryId && matching.some((category) => category.id === categoryId)) {
    return categoryId;
  }
  return matching[0]?.id ?? null;
}

export function validateQuickAmount(amount: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Please enter an amount greater than 0.';
  }
  return null;
}

/** Selection to apply after a category is created from the quick form. */
export function selectCreatedCategory(category: { id: string; type: string }): {
  categoryId: string;
  type: QuickTransactionType;
} {
  return {
    categoryId: category.id,
    type: category.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
  };
}

export function normalizeQuickNote(note: string): string | undefined {
  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
