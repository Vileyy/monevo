export interface WalletFlow {
  income: number;
  expense: number;
}

export interface MonthlyFlows {
  all: WalletFlow;
  byWallet: Record<string, WalletFlow>;
}

export interface FlowTransaction {
  walletId: string;
  type: string;
  amount: number;
  date: string;
}

/**
 * The carousel's first slide is the aggregated view, so a wallet's index is
 * offset by one (and `null` selection always maps back to index 0).
 */
export function walletIndexForId(
  wallets: readonly { id: string }[],
  walletId: string | null,
): number {
  if (!walletId) return 0;
  const index = wallets.findIndex((wallet) => wallet.id === walletId);
  return index === -1 ? 0 : index + 1;
}

export function walletIdForIndex(
  wallets: readonly { id: string }[],
  index: number,
): string | null {
  if (index <= 0) return null;
  return wallets[index - 1]?.id ?? null;
}

export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(total - 1, index));
}

/** Maps a horizontal scroll offset to the nearest slide, clamped to the range. */
export function slideIndexForOffset(
  offsetX: number,
  width: number,
  total: number,
): number {
  if (width <= 0) return 0;
  return clampSlideIndex(Math.round(offsetX / width), total);
}

export function computeMonthlyFlows(
  transactions: readonly FlowTransaction[],
  now: Date = new Date(),
): MonthlyFlows {
  const all: WalletFlow = { income: 0, expense: 0 };
  const byWallet: Record<string, WalletFlow> = {};

  for (const tx of transactions) {
    const date = new Date(tx.date);
    if (
      date.getMonth() !== now.getMonth() ||
      date.getFullYear() !== now.getFullYear()
    ) {
      continue;
    }

    const walletFlow = (byWallet[tx.walletId] ??= { income: 0, expense: 0 });
    if (tx.type === 'INCOME') {
      walletFlow.income += tx.amount;
      all.income += tx.amount;
    } else {
      walletFlow.expense += tx.amount;
      all.expense += tx.amount;
    }
  }

  return { all, byWallet };
}
