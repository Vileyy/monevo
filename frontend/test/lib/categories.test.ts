import {
  CATEGORY_ICON_OPTIONS,
  getCategoryFallback,
  getCategoryIconMeta,
  getWalletMeta,
} from '@/lib/categories';

const isFilled = (icon: string) => !icon.endsWith('-outline');

describe('category icon palette', () => {
  it('offers filled glyphs with a palette for custom categories', () => {
    expect(CATEGORY_ICON_OPTIONS.length).toBeGreaterThan(0);
    for (const option of CATEGORY_ICON_OPTIONS) {
      expect(isFilled(option.icon)).toBe(true);
      expect(option.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(option.bgColor).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('has no duplicate icon ids', () => {
    const icons = CATEGORY_ICON_OPTIONS.map((option) => option.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe('getCategoryIconMeta', () => {
  it('resolves an icon id stored on a category', () => {
    expect(getCategoryIconMeta('fitness')).toEqual({
      icon: 'fitness',
      color: '#047857',
      bgColor: '#ECFDF5',
    });
  });

  it('uses the palette from the icon picker', () => {
    for (const option of CATEGORY_ICON_OPTIONS) {
      expect(getCategoryIconMeta(option.icon)).toEqual(option);
    }
  });

  it('returns null for missing or unknown icon ids', () => {
    expect(getCategoryIconMeta(null)).toBeNull();
    expect(getCategoryIconMeta(undefined)).toBeNull();
    expect(getCategoryIconMeta('')).toBeNull();
    expect(getCategoryIconMeta('not-a-real-icon')).toBeNull();
  });
});

describe('getCategoryFallback', () => {
  it('falls back by transaction type', () => {
    expect(getCategoryFallback('INCOME').icon).toBe('cash');
    expect(getCategoryFallback('EXPENSE').icon).toBe('cart');
  });

  it('defaults to the expense badge', () => {
    expect(getCategoryFallback()).toEqual(getCategoryFallback('EXPENSE'));
  });

  it('uses filled glyphs', () => {
    const icons = [
      getCategoryFallback('INCOME').icon,
      getCategoryFallback('EXPENSE').icon,
    ];
    icons.forEach((icon) => expect(isFilled(icon)).toBe(true));
  });
});

describe('getWalletMeta', () => {
  it('maps each wallet type to a filled badge', () => {
    const cases = [
      { type: 'BANK', icon: 'business', label: 'Bank Account' },
      { type: 'CREDIT_CARD', icon: 'card', label: 'Credit Card' },
      { type: 'CASH', icon: 'cash', label: 'Cash Wallet' },
    ];

    for (const expected of cases) {
      const meta = getWalletMeta(expected.type);
      expect(meta.icon).toBe(expected.icon);
      expect(meta.label).toBe(expected.label);
      expect(isFilled(meta.icon)).toBe(true);
    }
  });

  it('defaults unknown types to cash', () => {
    const meta = getWalletMeta('SAVINGS');
    expect(meta.icon).toBe('cash');
    expect(meta.label).toBe('Cash Wallet');
  });
});
