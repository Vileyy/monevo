import React from 'react';
import {
  CATEGORY_ICON_OPTIONS,
  getCategoryFallback,
  getWalletMeta,
} from '@/lib/categories';

import {
  CategoryGlyph,
  PHOSPHOR_ICON_MAP,
} from '@/components/ui/CategoryGlyph';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: jest.fn((props) => ({ type: 'Ionicons', props })),
}));

const makeIcon = (name: string) =>
  jest.fn((props) => ({ type: `Phosphor:${name}`, props }));

jest.mock('phosphor-react-native/src/icons/AirplaneTilt', () => ({
  AirplaneTilt: makeIcon('AirplaneTilt'),
}));
jest.mock('phosphor-react-native/src/icons/Bank', () => ({
  Bank: makeIcon('Bank'),
}));
jest.mock('phosphor-react-native/src/icons/Car', () => ({
  Car: makeIcon('Car'),
}));
jest.mock('phosphor-react-native/src/icons/Coffee', () => ({
  Coffee: makeIcon('Coffee'),
}));
jest.mock('phosphor-react-native/src/icons/CreditCard', () => ({
  CreditCard: makeIcon('CreditCard'),
}));
jest.mock('phosphor-react-native/src/icons/FilmStrip', () => ({
  FilmStrip: makeIcon('FilmStrip'),
}));
jest.mock('phosphor-react-native/src/icons/FirstAidKit', () => ({
  FirstAidKit: makeIcon('FirstAidKit'),
}));
jest.mock('phosphor-react-native/src/icons/ForkKnife', () => ({
  ForkKnife: makeIcon('ForkKnife'),
}));
jest.mock('phosphor-react-native/src/icons/GameController', () => ({
  GameController: makeIcon('GameController'),
}));
jest.mock('phosphor-react-native/src/icons/Gift', () => ({
  Gift: makeIcon('Gift'),
}));
jest.mock('phosphor-react-native/src/icons/GraduationCap', () => ({
  GraduationCap: makeIcon('GraduationCap'),
}));
jest.mock('phosphor-react-native/src/icons/Heartbeat', () => ({
  Heartbeat: makeIcon('Heartbeat'),
}));
jest.mock('phosphor-react-native/src/icons/House', () => ({
  House: makeIcon('House'),
}));
jest.mock('phosphor-react-native/src/icons/Money', () => ({
  Money: makeIcon('Money'),
}));
jest.mock('phosphor-react-native/src/icons/Receipt', () => ({
  Receipt: makeIcon('Receipt'),
}));
jest.mock('phosphor-react-native/src/icons/ShoppingCart', () => ({
  ShoppingCart: makeIcon('ShoppingCart'),
}));
jest.mock('phosphor-react-native/src/icons/TrendUp', () => ({
  TrendUp: makeIcon('TrendUp'),
}));
jest.mock('phosphor-react-native/src/icons/Wallet', () => ({
  Wallet: makeIcon('Wallet'),
}));

describe('CategoryGlyph', () => {
  it('maps every category picker option to a Phosphor icon', () => {
    for (const option of CATEGORY_ICON_OPTIONS) {
      expect(PHOSPHOR_ICON_MAP[option.icon]).toBeDefined();
    }
  });

  it('maps category fallbacks and wallet icons to Phosphor icons', () => {
    expect(PHOSPHOR_ICON_MAP[getCategoryFallback('INCOME').icon]).toBeDefined();
    expect(
      PHOSPHOR_ICON_MAP[getCategoryFallback('EXPENSE').icon],
    ).toBeDefined();
    expect(PHOSPHOR_ICON_MAP[getWalletMeta('BANK').icon]).toBeDefined();
    expect(PHOSPHOR_ICON_MAP[getWalletMeta('CREDIT_CARD').icon]).toBeDefined();
    expect(PHOSPHOR_ICON_MAP[getWalletMeta('CASH').icon]).toBeDefined();
  });

  it('renders mapped icons with duotone weight by default', () => {
    const element = CategoryGlyph({
      icon: 'restaurant',
      size: 22,
      color: '#C2410C',
    }) as React.ReactElement<{ size: number; color: string; weight: string }>;

    expect(element.type).toBe(PHOSPHOR_ICON_MAP.restaurant);
    expect(element.props).toEqual({
      size: 22,
      color: '#C2410C',
      weight: 'duotone',
    });
  });

  it('falls back to Ionicons for unmapped icon ids', () => {
    const { Ionicons } = jest.requireMock('@expo/vector-icons');
    const element = CategoryGlyph({
      icon: 'alarm-outline',
      size: 18,
      color: '#0F172A',
    }) as React.ReactElement<{ name: string; size: number; color: string }>;

    expect(element.type).toBe(Ionicons);
    expect(element.props).toEqual({
      name: 'alarm-outline',
      size: 18,
      color: '#0F172A',
    });
  });
});
