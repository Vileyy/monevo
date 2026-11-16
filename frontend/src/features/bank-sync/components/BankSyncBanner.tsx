import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBankSyncStore } from '@/store/bank-sync.store';
import { colors, radius, spacing, typography } from '@/theme';
import { formatCurrency } from '@/lib/format';

interface Props {
  onPress: () => void;
}

export function BankSyncBanner({ onPress }: Props) {
  const pendingTransactions = useBankSyncStore(
    (state) => state.pendingTransactions,
  );

  if (!pendingTransactions.length) {
    return null;
  }

  const firstItem = pendingTransactions[0];
  const count = pendingTransactions.length;
  const isIncome = firstItem.type === 'INCOME';
  const sign = isIncome ? '+' : '-';

  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && styles.bannerPressed]}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="notifications" size={18} color={colors.primary} />
      </View>

      <View style={styles.textContainer}>
        <View style={styles.headlineRow}>
          <Text style={styles.title}>
            {count > 1
              ? `Có ${count} giao dịch ngân hàng mới`
              : `Phát hiện: ${firstItem.bankName}`}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count} mới</Text>
          </View>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {sign}
          {formatCurrency(firstItem.amount)} •{' '}
          {firstItem.note || 'Chạm để lưu vào ví'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.base,
  },
  bannerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.xs,
  },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  title: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  subtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
});
