import {
  SORT_OPTIONS,
  sortOptionFor,
  walletFilterLabel,
  walletFilterOptions,
} from '../../src/features/transactions/utils/transaction-filters';

const wallets = [
  { id: 'w1', name: 'Cash', type: 'CASH' },
  { id: 'w2', name: 'Techcombank', type: 'BANK' },
];

describe('transaction filter options', () => {
  it('lists every sort option with its own icon', () => {
    expect(SORT_OPTIONS.map((option) => option.value)).toEqual([
      'DATE_DESC',
      'AMOUNT_DESC',
      'AMOUNT_ASC',
    ]);
    SORT_OPTIONS.forEach((option) => expect(option.icon).toBeTruthy());
  });

  it('resolves the label and icon for the active sort', () => {
    expect(sortOptionFor('AMOUNT_DESC')).toEqual({
      value: 'AMOUNT_DESC',
      label: 'High → Low',
      icon: 'trending-down-outline',
    });
    expect(sortOptionFor('DATE_DESC').label).toBe('Latest');
  });

  it('falls back to the latest sort for unknown values', () => {
    expect(sortOptionFor('WHATEVER' as never).value).toBe('DATE_DESC');
  });

  it('puts all accounts first in the account filter', () => {
    expect(walletFilterOptions(wallets)).toEqual([
      { value: 'ALL', label: 'All accounts', icon: 'wallet-outline' },
      { value: 'w1', label: 'Cash', icon: 'cash' },
      { value: 'w2', label: 'Techcombank', icon: 'business' },
    ]);
  });

  it('labels the account filter with the selected wallet name', () => {
    expect(walletFilterLabel(wallets, 'ALL')).toBe('All accounts');
    expect(walletFilterLabel(wallets, 'w2')).toBe('Techcombank');
  });

  it('falls back to all accounts when the wallet is gone', () => {
    expect(walletFilterLabel(wallets, 'missing')).toBe('All accounts');
    expect(walletFilterLabel([], 'w1')).toBe('All accounts');
  });
});
