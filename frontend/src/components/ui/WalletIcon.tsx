import React from 'react';
import { ViewStyle } from 'react-native';
import { IconBadge, IconBadgeSize } from '@/components/ui/IconBadge';
import { getWalletMeta } from '@/lib/categories';

export interface WalletIconProps {
  type: string;
  size?: IconBadgeSize;
  style?: ViewStyle;
}

export function WalletIcon({ type, size = 'md', style }: WalletIconProps) {
  const meta = getWalletMeta(type);

  return (
    <IconBadge
      icon={meta.icon}
      color={meta.color}
      backgroundColor={meta.bgColor}
      size={size}
      style={style}
    />
  );
}
