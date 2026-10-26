import { getWalletMeta, type IconName } from '@/lib/categories';

export type SortOption = 'DATE_DESC' | 'AMOUNT_DESC' | 'AMOUNT_ASC';

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  icon?: IconName;
};

export const SORT_OPTIONS: (FilterOption<SortOption> & { icon: IconName })[] = [
  { value: 'DATE_DESC', label: 'Latest', icon: 'time-outline' },
  { value: 'AMOUNT_DESC', label: 'High → Low', icon: 'trending-down-outline' },
  { value: 'AMOUNT_ASC', label: 'Low → High', icon: 'trending-up-outline' },
];

export function sortOptionFor(
  sortBy: SortOption,
): FilterOption<SortOption> & { icon: IconName } {
  return (
    SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0]
  );
}

export function walletFilterOptions(
  wallets: { id: string; name: string; type: string }[],
): FilterOption<string>[] {
  return [
    { value: 'ALL', label: 'All accounts', icon: 'wallet-outline' },
    ...wallets.map((wallet) => ({
      value: wallet.id,
      label: wallet.name,
      icon: getWalletMeta(wallet.type).icon,
    })),
  ];
}

export function walletFilterLabel(
  wallets: { id: string; name: string }[],
  selectedId: string,
): string {
  if (selectedId === 'ALL') return 'All accounts';
  return (
    wallets.find((wallet) => wallet.id === selectedId)?.name ?? 'All accounts'
  );
}
