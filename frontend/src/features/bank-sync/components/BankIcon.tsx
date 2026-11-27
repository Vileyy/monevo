import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BankCode } from '../types';
import { SUPPORTED_BANKS } from '../utils/bankParsers';
import { colors } from '@/theme';

const VIETQR_LOGO_URLS: Partial<Record<BankCode, string>> = {
  TCB: 'https://cdn.vietqr.io/img/TCB.png',
  VCB: 'https://cdn.vietqr.io/img/VCB.png',
  MB: 'https://cdn.vietqr.io/img/MB.png',
  VPB: 'https://cdn.vietqr.io/img/VPB.png',
  ACB: 'https://cdn.vietqr.io/img/ACB.png',
  TPB: 'https://cdn.vietqr.io/img/TPB.png',
  BIDV: 'https://cdn.vietqr.io/img/BIDV.png',
  CTG: 'https://cdn.vietqr.io/img/ICB.png',
  MOMO: 'https://cdn.vietqr.io/img/momo.png',
  ZALOPAY: 'https://cdn.vietqr.io/img/ZALOPAY.png',
};

export interface BankIconProps {
  code: BankCode;
  width?: number;
  height?: number;
}

export const BankIcon = memo(function BankIcon({
  code,
  width = 110,
  height = 28,
}: BankIconProps) {
  const [failed, setFailed] = useState(false);
  const logoUri = VIETQR_LOGO_URLS[code];
  const meta = SUPPORTED_BANKS[code] ?? SUPPORTED_BANKS.GENERIC;

  if (!logoUri || failed) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Ionicons name="business-outline" size={18} color={meta.brandColor} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: logoUri }}
      style={{ width, height }}
      contentFit="contain"
      cachePolicy="memory-disk"
      transition={150}
      onError={() => setFailed(true)}
      accessibilityLabel={meta.name}
    />
  );
});

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
});
