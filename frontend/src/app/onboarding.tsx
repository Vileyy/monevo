import React, { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { Button } from "@/components/ui";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  illustration: "wallets" | "transactions" | "analytics";
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    badge: "ACCOUNT MANAGEMENT",
    title: "All Your Accounts\nIn One Secure Place",
    subtitle:
      "Track cash, bank accounts, and credit cards in real-time with automatic balance calculations.",
    illustration: "wallets",
  },
  {
    id: "2",
    badge: "EXPENSE TRACKING",
    title: "Log Spending\nIn Just a Few Seconds",
    subtitle:
      "Categorize daily expenses effortlessly with smart presets, custom notes, and quick amount shortcuts.",
    illustration: "transactions",
  },
  {
    id: "3",
    badge: "SMART INSIGHTS",
    title: "Visualize Your Wealth\nAnd Boost Your Savings",
    subtitle:
      "Gain total financial clarity with automated cashflow analytics, category breakdowns, and savings progress.",
    illustration: "analytics",
  },
];

function SlideIllustration({
  type,
}: {
  type: OnboardingSlide["illustration"];
}) {
  if (type === "wallets") {
    return (
      <View style={styles.illustrationWrapper}>
        {/* Visual Card 1: Bank */}
        <View style={[styles.mockCard, styles.mockBankCard]}>
          <View style={styles.mockCardHeader}>
            <Ionicons name="business-outline" size={20} color="#93C5FD" />
            <Text style={styles.mockCardType}>BANK</Text>
          </View>
          <Text style={styles.mockCardName}>Techcombank</Text>
          <Text style={styles.mockCardBalance}>24.500.000 ₫</Text>
        </View>

        {/* Visual Card 2: Cash (Elevated Top) */}
        <View style={[styles.mockCard, styles.mockCashCard]}>
          <View style={styles.mockCardHeader}>
            <Ionicons name="cash-outline" size={20} color="#A7F3D0" />
            <Text style={styles.mockCardType}>CASH</Text>
          </View>
          <Text style={styles.mockCardName}>Daily Cash</Text>
          <Text style={styles.mockCardBalance}>3.200.000 ₫</Text>
        </View>
      </View>
    );
  }

  if (type === "transactions") {
    return (
      <View style={styles.illustrationWrapper}>
        <View style={styles.mockTxContainer}>
          {/* Mock Tx 1 */}
          <View style={styles.mockTxRow}>
            <View style={[styles.mockIcon, { backgroundColor: "#FFEDD5" }]}>
              <Ionicons name="restaurant-outline" size={18} color="#EA580C" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.mockTxTitle}>Dinner with Friends</Text>
              <Text style={styles.mockTxSub}>Food · Cash</Text>
            </View>
            <Text style={[styles.mockTxAmount, { color: colors.expense }]}>
              −150.000 ₫
            </Text>
          </View>

          {/* Mock Tx 2 */}
          <View style={styles.mockTxRow}>
            <View style={[styles.mockIcon, { backgroundColor: "#D1FAE5" }]}>
              <Ionicons name="cash-outline" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.mockTxTitle}>Monthly Salary</Text>
              <Text style={styles.mockTxSub}>Salary · Bank</Text>
            </View>
            <Text style={[styles.mockTxAmount, { color: colors.income }]}>
              +25.000.000 ₫
            </Text>
          </View>

          {/* Mock Tx 3 */}
          <View style={styles.mockTxRow}>
            <View style={[styles.mockIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="car-outline" size={18} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.mockTxTitle}>Grab Transport</Text>
              <Text style={styles.mockTxSub}>Transport · Card</Text>
            </View>
            <Text style={[styles.mockTxAmount, { color: colors.expense }]}>
              −45.000 ₫
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Analytics illustration
  return (
    <View style={styles.illustrationWrapper}>
      <View style={styles.mockAnalyticsCard}>
        <View style={styles.mockAnalyticsHeader}>
          <View>
            <Text style={styles.mockAnalyticsLabel}>NET SAVINGS</Text>
            <Text style={styles.mockAnalyticsValue}>+18.450.000 ₫</Text>
          </View>
          <View style={styles.mockSavingsBadge}>
            <Text style={styles.mockSavingsText}>68% Saved</Text>
          </View>
        </View>

        {/* Progress Bar 1 */}
        <View style={styles.mockBarItem}>
          <View style={styles.mockBarLabelRow}>
            <Text style={styles.mockBarLabel}>Food & Dining</Text>
            <Text style={styles.mockBarVal}>35%</Text>
          </View>
          <View style={styles.mockBarBg}>
            <View
              style={[
                styles.mockBarFill,
                { width: "35%", backgroundColor: "#EA580C" },
              ]}
            />
          </View>
        </View>

        {/* Progress Bar 2 */}
        <View style={styles.mockBarItem}>
          <View style={styles.mockBarLabelRow}>
            <Text style={styles.mockBarLabel}>Shopping & Bills</Text>
            <Text style={styles.mockBarVal}>22%</Text>
          </View>
          <View style={styles.mockBarBg}>
            <View
              style={[
                styles.mockBarFill,
                { width: "22%", backgroundColor: "#DB2777" },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (activeIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      router.replace("/register");
    }
  };

  const handleSkip = () => {
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Ionicons name="wallet" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.brandText}>MONEVO</Text>
        </View>

        <Pressable
          onPress={handleSkip}
          style={styles.skipBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Paged Slider */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.sliderContent}
      >
        {SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.illustrationContainer}>
              <SlideIllustration type={slide.illustration} />
            </View>

            <View style={styles.textContainer}>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{slide.badge}</Text>
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        {/* Pagination Indicator */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, idx) => (
            <View
              key={slide.id}
              style={[styles.dot, activeIndex === idx && styles.dotActive]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {activeIndex === SLIDES.length - 1 ? (
            <View style={styles.finalActionGroup}>
              <Button
                title="Get Started"
                onPress={() => router.replace("/register")}
                size="lg"
                rightIcon={
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                }
              />

              <Pressable
                onPress={() => router.replace("/login")}
                style={styles.loginLink}
                hitSlop={8}
              >
                <Text style={styles.loginLinkText}>
                  Already have an account?{" "}
                  <Text style={styles.loginLinkHighlight}>Sign in</Text>
                </Text>
              </Pressable>
            </View>
          ) : (
            <Button
              title="Next"
              onPress={handleNext}
              size="lg"
              rightIcon={
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.xs + 2,
    ...shadows.sm,
  },
  brandText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.text,
  },
  skipBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipText: {
    ...typography.subhead,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sliderContent: {
    alignItems: "center",
  },
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.xl,
    justifyContent: "center",
  },
  illustrationContainer: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  illustrationWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mockCard: {
    width: "88%",
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.md,
  },
  mockBankCard: {
    backgroundColor: "#1E3A8A",
    transform: [{ rotate: "-4deg" }, { translateY: -12 }],
  },
  mockCashCard: {
    backgroundColor: "#065F46",
    marginTop: -40,
    transform: [{ rotate: "2deg" }],
  },
  mockCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mockCardType: {
    ...typography.caption,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
  },
  mockCardName: {
    ...typography.subhead,
    color: "#FFFFFF",
    fontWeight: "600",
    marginTop: spacing.md,
  },
  mockCardBalance: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
    ...typography.tabular,
  },
  mockTxContainer: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadows.sm,
  },
  mockTxRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  mockIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  mockTxTitle: {
    ...typography.footnote,
    fontWeight: "600",
    color: colors.text,
  },
  mockTxSub: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
  mockTxAmount: {
    ...typography.footnote,
    fontWeight: "700",
    ...typography.tabular,
  },
  mockAnalyticsCard: {
    width: "100%",
    backgroundColor: colors.surfaceDark,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  mockAnalyticsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  mockAnalyticsLabel: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  mockAnalyticsValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6EE7B7",
    marginTop: 2,
    ...typography.tabular,
  },
  mockSavingsBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  mockSavingsText: {
    ...typography.caption,
    color: "#34D399",
    fontWeight: "700",
  },
  mockBarItem: {
    marginTop: spacing.xs,
  },
  mockBarLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  mockBarLabel: {
    ...typography.caption,
    color: "rgba(255, 255, 255, 0.7)",
  },
  mockBarVal: {
    ...typography.caption,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  mockBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: radius.full,
    overflow: "hidden",
  },
  mockBarFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  badgeContainer: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.primary,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs + 2,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  actionRow: {
    width: "100%",
  },
  finalActionGroup: {
    width: "100%",
    alignItems: "center",
  },
  loginLink: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  loginLinkText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  loginLinkHighlight: {
    color: colors.primary,
    fontWeight: "700",
  },
});
