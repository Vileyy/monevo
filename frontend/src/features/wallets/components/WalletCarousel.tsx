import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { IconName } from '@/lib/categories';
import { getWalletMeta } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import { useDisplayCurrency } from '@/hooks/use-display-currency';
import { hapticFeedback } from '@/lib/haptics';
import { useSettingsStore } from '@/store/settings.store';
import { Wallet } from '@/store/wallet.store';
import { MonthlyFlows, WalletFlow } from '../utils/wallet-carousel';
import { WalletSelectorModal } from './WalletSelectorModal';

export interface WalletCarouselProps {
  wallets: Wallet[];
  monthlyFlows: MonthlyFlows;
  activeWalletId: string | null;
  onSelectWallet: (walletId: string | null) => void;
}

interface WalletSlide {
  key: string;
  title: string;
  subtitle: string;
  balance: number;
  flow: WalletFlow;
  icon: IconName;
  gradient: [string, string];
}

const ALL_WALLETS_GRADIENT: [string, string] = ['#0F172A', '#115E59'];
const EMPTY_FLOW: WalletFlow = { income: 0, expense: 0 };

function toWalletSlide(
  wallet: Wallet,
  monthlyFlows: MonthlyFlows,
): WalletSlide {
  const meta = getWalletMeta(wallet.type);
  return {
    key: wallet.id,
    title: wallet.name,
    subtitle: meta.label,
    balance: wallet.balance,
    flow: monthlyFlows.byWallet[wallet.id] ?? EMPTY_FLOW,
    icon: meta.icon,
    gradient: [colors.surfaceDark, meta.gradient[0]] as [string, string],
  };
}

function resolveActiveSlide(
  wallets: Wallet[],
  monthlyFlows: MonthlyFlows,
  activeWalletId: string | null,
): WalletSlide {
  if (wallets.length === 1) {
    return toWalletSlide(wallets[0], monthlyFlows);
  }

  if (wallets.length > 1 && activeWalletId) {
    const selected = wallets.find((w) => w.id === activeWalletId);
    if (selected) {
      return toWalletSlide(selected, monthlyFlows);
    }
  }

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return {
    key: 'all',
    title: 'Total Balance',
    subtitle:
      wallets.length === 0 ? 'No wallets yet' : `${wallets.length} wallets`,
    balance: totalBalance,
    flow: monthlyFlows.all,
    icon: 'wallet',
    gradient: ALL_WALLETS_GRADIENT,
  };
}

interface CardFaceProps {
  slide: WalletSlide;
  hideBalance: boolean;
  canSwitch: boolean;
  onOpenSwitcher: () => void;
  onToggleHide: () => void;
}

const CardFace = memo(function CardFace({
  slide,
  hideBalance,
  canSwitch,
  onOpenSwitcher,
  onToggleHide,
}: CardFaceProps) {
  useDisplayCurrency();

  const headerContent = (
    <>
      <View style={styles.iconBadge}>
        <Ionicons name={slide.icon} size={17} color="#FFFFFF" />
      </View>

      <View style={styles.titleBlock}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {slide.title}
          </Text>
          {canSwitch && (
            <View style={styles.chevronBadge}>
              <Ionicons
                name="chevron-down"
                size={12}
                color="rgba(255, 255, 255, 0.9)"
              />
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {slide.subtitle}
        </Text>
      </View>
    </>
  );

  return (
    <LinearGradient
      colors={slide.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityLabel={`${slide.title}, ${slide.subtitle}, balance ${
        hideBalance ? 'hidden' : formatCurrency(slide.balance)
      }`}
    >
      <View pointerEvents="none" style={styles.cardGlow} />

      <View style={styles.cardTopRow}>
        {canSwitch ? (
          <Pressable
            onPress={onOpenSwitcher}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Switch wallet, currently ${slide.title}`}
            style={({ pressed }) => [
              styles.headerTrigger,
              pressed && styles.headerTriggerPressed,
            ]}
          >
            {headerContent}
          </Pressable>
        ) : (
          <View style={styles.headerTrigger}>{headerContent}</View>
        )}

        <Pressable
          onPress={onToggleHide}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Toggle balance visibility"
          style={({ pressed }) => [
            styles.eyeBtn,
            pressed && styles.eyeBtnPressed,
          ]}
        >
          <Ionicons
            name={hideBalance ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color="rgba(255, 255, 255, 0.8)"
          />
        </Pressable>
      </View>

      <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
        {hideBalance ? '••••••••' : formatCurrency(slide.balance)}
      </Text>

      <View style={styles.flowStrip}>
        <View style={styles.flowItem}>
          <View style={styles.flowLabelRow}>
            <View style={[styles.flowDot, { backgroundColor: '#34D399' }]} />
            <Text style={styles.flowLabel}>Income</Text>
          </View>
          <Text
            style={[styles.flowValue, { color: '#6EE7B7' }]}
            numberOfLines={1}
          >
            {hideBalance ? '••••' : `+${formatCurrency(slide.flow.income)}`}
          </Text>
        </View>

        <View style={styles.flowDivider} />

        <View style={styles.flowItem}>
          <View style={styles.flowLabelRow}>
            <View style={[styles.flowDot, { backgroundColor: '#FB7185' }]} />
            <Text style={styles.flowLabel}>Expense</Text>
          </View>
          <Text
            style={[styles.flowValue, { color: '#FDA4AF' }]}
            numberOfLines={1}
          >
            {hideBalance ? '••••' : `−${formatCurrency(slide.flow.expense)}`}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
});

export function WalletCarousel({
  wallets,
  monthlyFlows,
  activeWalletId,
  onSelectWallet,
}: WalletCarouselProps) {
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const toggleHideBalance = useSettingsStore(
    (state) => state.toggleHideBalance,
  );
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const canSwitch = wallets.length > 1;
  const activeSlide = useMemo(
    () => resolveActiveSlide(wallets, monthlyFlows, activeWalletId),
    [wallets, monthlyFlows, activeWalletId],
  );

  useEffect(() => {
    if (!activeWalletId) return;
    if (wallets.length <= 1 || !wallets.some((w) => w.id === activeWalletId)) {
      onSelectWallet(null);
    }
  }, [activeWalletId, onSelectWallet, wallets]);

  const handleOpenSwitcher = useCallback(() => {
    hapticFeedback.light();
    setSwitcherVisible(true);
  }, []);

  const handleSelectWallet = useCallback(
    (walletId: string | null) => {
      hapticFeedback.selection();
      onSelectWallet(walletId);
    },
    [onSelectWallet],
  );

  const handleToggleHide = useCallback(() => {
    hapticFeedback.selection();
    toggleHideBalance();
  }, [toggleHideBalance]);

  return (
    <View style={styles.container}>
      <View style={styles.cardShell}>
        <CardFace
          slide={activeSlide}
          hideBalance={hideBalance}
          canSwitch={canSwitch}
          onOpenSwitcher={handleOpenSwitcher}
          onToggleHide={handleToggleHide}
        />
      </View>

      {canSwitch && (
        <WalletSelectorModal
          visible={switcherVisible}
          onClose={() => setSwitcherVisible(false)}
          wallets={wallets}
          selectedWalletId={activeWalletId}
          onSelectWallet={handleSelectWallet}
          allowAllAccounts
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.xs,
  },
  cardShell: {
    borderRadius: radius.xxl,
    ...shadows.lg,
  },
  card: {
    borderRadius: radius.xxl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -72,
    right: -56,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTrigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTriggerPressed: {
    opacity: 0.72,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevronBadge: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
    flexShrink: 1,
  },
  cardSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 1,
  },
  eyeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeBtnPressed: {
    opacity: 0.65,
  },
  balanceValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    ...typography.tabular,
  },
  flowStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  flowItem: {
    flex: 1,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  flowLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.68)',
    letterSpacing: 0.2,
  },
  flowValue: {
    ...typography.bodyBold,
    marginTop: 2,
    ...typography.tabular,
  },
  flowDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: spacing.md,
  },
});
