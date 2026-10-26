import React from 'react';
import { ViewStyle } from 'react-native';
import { IconBadge, IconBadgeSize } from '@/components/ui/IconBadge';
import { getCategoryFallback, getCategoryIconMeta } from '@/lib/categories';

export interface CategoryIconProps {
  type?: 'EXPENSE' | 'INCOME';
  icon?: string | null;
  size?: IconBadgeSize;
  style?: ViewStyle;
}

export function CategoryIcon({
  type = 'EXPENSE',
  icon,
  size = 'md',
  style,
}: CategoryIconProps) {
  const meta = getCategoryIconMeta(icon) ?? getCategoryFallback(type);

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
