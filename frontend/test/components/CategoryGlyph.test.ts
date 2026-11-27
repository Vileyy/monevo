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

jest.mock('phosphor-react-native/src/icons/AirplaneTilt', () => ({
  AirplaneTilt: jest.fn((props) => ({ type: 'Phosphor:AirplaneTilt', props })),
}));
jest.mock('phosphor-react-native/src/icons/Bank', () => ({
  Bank: jest.fn((props) => ({ type: 'Phosphor:Bank', props })),
}));
jest.mock('phosphor-react-native/src/icons/Car', () => ({
  Car: jest.fn((props) => ({ type: 'Phosphor:Car', props })),
}));
jest.mock('phosphor-react-native/src/icons/Coffee', () => ({
  Coffee: jest.fn((props) => ({ type: 'Phosphor:Coffee', props })),
}));
jest.mock('phosphor-react-native/src/icons/CreditCard', () => ({
  CreditCard: jest.fn((props) => ({ type: 'Phosphor:CreditCard', props })),
}));
jest.mock('phosphor-react-native/src/icons/FilmStrip', () => ({
  FilmStrip: jest.fn((props) => ({ type: 'Phosphor:FilmStrip', props })),
}));
jest.mock('phosphor-react-native/src/icons/FirstAidKit', () => ({
  FirstAidKit: jest.fn((props) => ({ type: 'Phosphor:FirstAidKit', props })),
}));
jest.mock('phosphor-react-native/src/icons/ForkKnife', () => ({
  ForkKnife: jest.fn((props) => ({ type: 'Phosphor:ForkKnife', props })),
}));
jest.mock('phosphor-react-native/src/icons/GameController', () => ({
  GameController: jest.fn((props) => ({
    type: 'Phosphor:GameController',
    props,
  })),
}));
jest.mock('phosphor-react-native/src/icons/Gift', () => ({
  Gift: jest.fn((props) => ({ type: 'Phosphor:Gift', props })),
}));
jest.mock('phosphor-react-native/src/icons/GraduationCap', () => ({
  GraduationCap: jest.fn((props) => ({
    type: 'Phosphor:GraduationCap',
    props,
  })),
}));
jest.mock('phosphor-react-native/src/icons/Heartbeat', () => ({
  Heartbeat: jest.fn((props) => ({ type: 'Phosphor:Heartbeat', props })),
}));
jest.mock('phosphor-react-native/src/icons/House', () => ({
  House: jest.fn((props) => ({ type: 'Phosphor:House', props })),
}));
jest.mock('phosphor-react-native/src/icons/Money', () => ({
  Money: jest.fn((props) => ({ type: 'Phosphor:Money', props })),
}));
jest.mock('phosphor-react-native/src/icons/Receipt', () => ({
  Receipt: jest.fn((props) => ({ type: 'Phosphor:Receipt', props })),
}));
jest.mock('phosphor-react-native/src/icons/ShoppingCart', () => ({
  ShoppingCart: jest.fn((props) => ({ type: 'Phosphor:ShoppingCart', props })),
}));
jest.mock('phosphor-react-native/src/icons/TrendUp', () => ({
  TrendUp: jest.fn((props) => ({ type: 'Phosphor:TrendUp', props })),
}));
jest.mock('phosphor-react-native/src/icons/Wallet', () => ({
  Wallet: jest.fn((props) => ({ type: 'Phosphor:Wallet', props })),
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
