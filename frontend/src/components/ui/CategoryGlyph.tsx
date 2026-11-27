import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Icon, IconWeight } from 'phosphor-react-native';
import { AirplaneTilt } from 'phosphor-react-native/src/icons/AirplaneTilt';
import { Bank } from 'phosphor-react-native/src/icons/Bank';
import { Car } from 'phosphor-react-native/src/icons/Car';
import { Coffee } from 'phosphor-react-native/src/icons/Coffee';
import { CreditCard } from 'phosphor-react-native/src/icons/CreditCard';
import { FilmStrip } from 'phosphor-react-native/src/icons/FilmStrip';
import { FirstAidKit } from 'phosphor-react-native/src/icons/FirstAidKit';
import { ForkKnife } from 'phosphor-react-native/src/icons/ForkKnife';
import { GameController } from 'phosphor-react-native/src/icons/GameController';
import { Gift } from 'phosphor-react-native/src/icons/Gift';
import { GraduationCap } from 'phosphor-react-native/src/icons/GraduationCap';
import { Heartbeat } from 'phosphor-react-native/src/icons/Heartbeat';
import { House } from 'phosphor-react-native/src/icons/House';
import { Money } from 'phosphor-react-native/src/icons/Money';
import { Receipt } from 'phosphor-react-native/src/icons/Receipt';
import { ShoppingCart } from 'phosphor-react-native/src/icons/ShoppingCart';
import { TrendUp } from 'phosphor-react-native/src/icons/TrendUp';
import { Wallet } from 'phosphor-react-native/src/icons/Wallet';
import type { IconName } from '@/lib/categories';

export const PHOSPHOR_ICON_MAP: Partial<Record<IconName, Icon>> = {
  restaurant: ForkKnife,
  cart: ShoppingCart,
  car: Car,
  receipt: Receipt,
  cafe: Coffee,
  home: House,
  fitness: Heartbeat,
  film: FilmStrip,
  medkit: FirstAidKit,
  school: GraduationCap,
  'game-controller': GameController,
  airplane: AirplaneTilt,
  gift: Gift,
  cash: Money,
  'trending-up': TrendUp,
  wallet: Wallet,
  business: Bank,
  card: CreditCard,
};

export interface CategoryGlyphProps {
  icon: IconName;
  size?: number;
  color: string;
  weight?: IconWeight;
}

/** Renders a Phosphor duotone icon for category/wallet keys, falling back to Ionicons. */
export function CategoryGlyph({
  icon,
  size = 20,
  color,
  weight = 'duotone',
}: CategoryGlyphProps) {
  const PhosphorIcon = PHOSPHOR_ICON_MAP[icon];
  if (PhosphorIcon) {
    return <PhosphorIcon size={size} color={color} weight={weight} />;
  }
  return <Ionicons name={icon} size={size} color={color} />;
}
