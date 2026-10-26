import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
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
import {
  clampSlideIndex,
  MonthlyFlows,
  slideIndexForOffset,
  WalletFlow,
  walletIdForIndex,
  walletIndexForId,
} from '../utils/wallet-carousel';

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
const CARD_HEIGHT = 196;

function buildSlides(
  wallets: Wallet[],
  monthlyFlows: MonthlyFlows,
): WalletSlide[] {
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return [
    {
      key: 'all',
      title: 'Total Balance',
      subtitle: `${wallets.length} ${wallets.length === 1 ? 'wallet' : 'wallets'}`,
      balance: totalBalance,
      flow: monthlyFlows.all,
      icon: 'wallet',
      gradient: ALL_WALLETS_GRADIENT,
    },
    ...wallets.map((wallet) => {
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
    }),
  ];
}

interface CardFaceProps {
  slide: WalletSlide;
  hideBalance: boolean;
  onToggleHide: () => void;
}

const CardFace = memo(function CardFace({
  slide,
  hideBalance,
  onToggleHide,
}: CardFaceProps) {
  useDisplayCurrency();
  const totalFlow = slide.flow.income + slide.flow.expense;
  const incomePercent =
    totalFlow > 0
      ? Math.max(
          4,
          Math.min(96, Math.round((slide.flow.income / totalFlow) * 100)),
        )
      : 0;

  return (
    <LinearGradient
      colors={slide.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
      accessibilityLabel={`${slide.title}, ${slide.subtitle}, balance ${
        hideBalance ? 'hidden' : formatCurrency(slide.balance)
      }`}
      accessibilityHint="Swipe left or right to browse your balances"
    >
      <View pointerEvents="none" style={styles.cardGlow} />

      <View style={styles.cardTopRow}>
        <View style={styles.iconBadge}>
          <Ionicons name={slide.icon} size={17} color="#FFFFFF" />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {slide.title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {slide.subtitle}
          </Text>
        </View>

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
            color="rgba(255, 255, 255, 0.75)"
          />
        </Pressable>
      </View>

      <Text style={styles.balanceValue} numberOfLines={1} adjustsFontSizeToFit>
        {hideBalance ? '••••••••' : formatCurrency(slide.balance)}
      </Text>

      <View style={styles.flowRow}>
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

      <View style={styles.flowBarTrack}>
        {totalFlow > 0 && !hideBalance && (
          <View style={[styles.flowBarFill, { width: `${incomePercent}%` }]} />
        )}
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
  const { width } = useWindowDimensions();
  const hideBalance = useSettingsStore((state) => state.hideBalance);
  const toggleHideBalance = useSettingsStore(
    (state) => state.toggleHideBalance,
  );
  const slides = useMemo(
    () => buildSlides(wallets, monthlyFlows),
    [wallets, monthlyFlows],
  );

  const [activeIndex, setActiveIndex] = useState(() =>
    walletIndexForId(wallets, activeWalletId),
  );
  const activeIndexRef = useRef(activeIndex);
  const lastActiveRef = useRef(activeWalletId);
  const listRef = useRef<FlatList<WalletSlide>>(null);
  const previousWidthRef = useRef(width);

  const scrollToIndex = useCallback(
    (index: number, animated: boolean) => {
      listRef.current?.scrollToOffset({ offset: index * width, animated });
    },
    [width],
  );

  useEffect(() => {
    if (lastActiveRef.current === activeWalletId) return;
    lastActiveRef.current = activeWalletId;
    const index = walletIndexForId(wallets, activeWalletId);
    activeIndexRef.current = index;
    setActiveIndex(index);
    scrollToIndex(index, true);
  }, [activeWalletId, scrollToIndex, wallets]);

  useEffect(() => {
    if (activeIndexRef.current <= slides.length - 1) return;
    const index = clampSlideIndex(activeIndexRef.current, slides.length);
    activeIndexRef.current = index;
    setActiveIndex(index);
    scrollToIndex(index, false);
  }, [scrollToIndex, slides.length]);

  useEffect(() => {
    if (previousWidthRef.current === width) return;
    previousWidthRef.current = width;
    scrollToIndex(activeIndexRef.current, false);
  }, [scrollToIndex, width]);

  const commitIndex = useCallback(
    (nextIndex: number, scroll: boolean) => {
      const index = clampSlideIndex(nextIndex, slides.length);
      if (index === activeIndexRef.current) return;

      const walletId = walletIdForIndex(wallets, index);
      activeIndexRef.current = index;
      lastActiveRef.current = walletId;
      setActiveIndex(index);
      hapticFeedback.selection();
      onSelectWallet(walletId);
      if (scroll) scrollToIndex(index, true);
    },
    [onSelectWallet, scrollToIndex, slides.length, wallets],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = slideIndexForOffset(
        event.nativeEvent.contentOffset.x,
        width,
        slides.length,
      );
      commitIndex(index, false);
    },
    [commitIndex, slides.length, width],
  );

  const handleToggleHide = useCallback(() => {
    hapticFeedback.selection();
    toggleHideBalance();
  }, [toggleHideBalance]);

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(slide) => slide.key}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        initialScrollIndex={activeIndex}
        onMomentumScrollEnd={handleScrollEnd}
        extraData={`${activeIndex}:${hideBalance}`}
        style={styles.list}
        renderItem={({ item, index }) => (
          <View
            style={[styles.page, { width }]}
            aria-hidden={index !== activeIndex}
          >
            <View style={styles.cardShell}>
              <CardFace
                slide={item}
                hideBalance={hideBalance}
                onToggleHide={handleToggleHide}
              />
            </View>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {slides.map((slide, index) => (
          <Pressable
            key={slide.key}
            onPress={() => commitIndex(index, true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Show ${slide.title}`}
            accessibilityState={{ selected: index === activeIndex }}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    height: CARD_HEIGHT + spacing.md,
  },
  page: {
    height: CARD_HEIGHT + spacing.md,
    paddingHorizontal: spacing.base,
  },
  cardShell: {
    height: CARD_HEIGHT,
    borderRadius: radius.xxl,
    ...shadows.lg,
  },
  card: {
    flex: 1,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: -64,
    right: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  titleBlock: {
    flex: 1,
  },
  cardTitle: {
    ...typography.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardSubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 1,
  },
  eyeBtn: {
    padding: 4,
    marginLeft: spacing.xs,
  },
  eyeBtnPressed: {
    opacity: 0.6,
  },
  balanceValue: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginTop: spacing.sm,
    ...typography.tabular,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  flowValue: {
    ...typography.bodyBold,
    marginTop: 2,
    ...typography.tabular,
  },
  flowDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginHorizontal: spacing.md,
  },
  flowBarTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  flowBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#34D399',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
