import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export const CATEGORY_ICON_OPTIONS: {
  icon: IconName;
  color: string;
  bgColor: string;
}[] = [
  { icon: 'restaurant', color: '#C2410C', bgColor: '#FFF7ED' },
  { icon: 'cart', color: '#BE185D', bgColor: '#FDF2F8' },
  { icon: 'car', color: '#1D4ED8', bgColor: '#EFF6FF' },
  { icon: 'receipt', color: '#A16207', bgColor: '#FEFCE8' },
  { icon: 'cafe', color: '#B45309', bgColor: '#FFFBEB' },
  { icon: 'home', color: '#4338CA', bgColor: '#EEF2FF' },
  { icon: 'fitness', color: '#047857', bgColor: '#ECFDF5' },
  { icon: 'film', color: '#6D28D9', bgColor: '#F5F3FF' },
  { icon: 'medkit', color: '#B91C1C', bgColor: '#FEF2F2' },
  { icon: 'school', color: '#0369A1', bgColor: '#F0F9FF' },
  { icon: 'game-controller', color: '#7E22CE', bgColor: '#FAF5FF' },
  { icon: 'airplane', color: '#0E7490', bgColor: '#ECFEFF' },
  { icon: 'gift', color: '#0F766E', bgColor: '#F0FDFA' },
  { icon: 'cash', color: '#047857', bgColor: '#ECFDF5' },
  { icon: 'trending-up', color: '#0E7490', bgColor: '#ECFEFF' },
  { icon: 'wallet', color: '#047857', bgColor: '#ECFDF5' },
];

const CATEGORY_ICON_META: Record<string, { color: string; bgColor: string }> =
  {};

for (const option of CATEGORY_ICON_OPTIONS) {
  CATEGORY_ICON_META[option.icon] = {
    color: option.color,
    bgColor: option.bgColor,
  };
}

const CATEGORY_TYPE_FALLBACK: Record<
  'EXPENSE' | 'INCOME',
  { icon: IconName; color: string; bgColor: string }
> = {
  INCOME: { icon: 'cash', color: '#047857', bgColor: '#ECFDF5' },
  EXPENSE: { icon: 'cart', color: '#475569', bgColor: '#F1F5F9' },
};

/** Palette for an icon id stored on a category; null for legacy/unknown ids. */
export function getCategoryIconMeta(icon?: string | null): {
  icon: IconName;
  color: string;
  bgColor: string;
} | null {
  if (!icon) return null;
  const meta = CATEGORY_ICON_META[icon];
  return meta ? { icon: icon as IconName, ...meta } : null;
}

/** Badge for categories saved before an icon was stored per category. */
export function getCategoryFallback(type: 'EXPENSE' | 'INCOME' = 'EXPENSE'): {
  icon: IconName;
  color: string;
  bgColor: string;
} {
  return CATEGORY_TYPE_FALLBACK[type];
}

export function getWalletMeta(type: string): {
  icon: IconName;
  label: string;
  gradient: [string, string];
  color: string;
  bgColor: string;
} {
  switch (type) {
    case 'BANK':
      return {
        icon: 'business',
        label: 'Bank Account',
        gradient: ['#1E40AF', '#3B82F6'],
        color: '#1D4ED8',
        bgColor: '#EFF6FF',
      };
    case 'CREDIT_CARD':
      return {
        icon: 'card',
        label: 'Credit Card',
        gradient: ['#5B21B6', '#7C3AED'],
        color: '#6D28D9',
        bgColor: '#F5F3FF',
      };
    case 'CASH':
    default:
      return {
        icon: 'cash',
        label: 'Cash Wallet',
        gradient: ['#047857', '#10B981'],
        color: '#047857',
        bgColor: '#ECFDF5',
      };
  }
}
