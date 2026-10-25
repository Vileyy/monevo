import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTabBarSpace } from "@/components/FloatingTabBar";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useClerk } from "@clerk/clerk-expo";
import { useWalletStore } from "@/store/wallet.store";
import { useTransactionStore } from "@/store/transaction.store";
import { useReminderStore } from "@/store/reminder.store";
import { useSettingsStore } from "@/store/settings.store";
import { getCurrencyConfig } from "@/lib/currencies";
import { formatCurrency } from "@/lib/format";
import { displayableEmail, getInitials } from "@/lib/user-profile";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { Card, Header } from "@/components/ui";
import { SettingsRow } from "@/features/profile/components/SettingsRow";
import { CurrencyPickerModal } from "@/features/profile/components/CurrencyPickerModal";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import {
  requestNotificationPermission,
  syncReminderNotifications,
} from "@/lib/notifications";
import { hapticFeedback } from "@/lib/haptics";
import { deleteUserAccount } from "@/lib/account";
import { openLegalPage } from "@/lib/legal-links";
import { apiErrorMessage } from "@/lib/api-error";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

export default function ProfileScreen() {
  const router = useRouter();
  const tabBarSpace = useTabBarSpace();
  const { signOut } = useClerk();
  useDisplayCurrency();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { wallets, fetchWallets } = useWalletStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { reminders } = useReminderStore();
  const {
    currency,
    hideBalance,
    toggleHideBalance,
    reminderNotifications,
    setReminderNotifications,
  } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleToggleNotifications = async () => {
    hapticFeedback.selection();
    if (!reminderNotifications) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setReminderNotifications(true);
        void syncReminderNotifications(reminders);
        Alert.alert(
          "Notifications Enabled",
          "You will receive bill reminder notifications at 9:00 AM before the due date.",
        );
      } else {
        Alert.alert(
          "Permission Denied",
          "Please enable notification permissions in your device settings to receive bill reminders.",
        );
      }
    } else {
      setReminderNotifications(false);
      void syncReminderNotifications([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallets(), fetchTransactions()]);
    setRefreshing(false);
  };

  const totalNetWorth = useMemo(() => {
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }, [wallets]);

  const currencyConfig = useMemo(() => {
    return getCurrencyConfig(currency);
  }, [currency]);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Monevo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            console.warn("Clerk signOut error:", e);
          }
          logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const performAccountDeletion = async () => {
    if (isDeletingAccount) return;

    setIsDeletingAccount(true);
    try {
      await deleteUserAccount();

      // Remove local session and any scheduled bill reminders.
      void syncReminderNotifications([]);
      try {
        await signOut();
      } catch (e) {
        console.warn("Clerk signOut error after account deletion:", e);
      }
      logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert(
        "Deletion Failed",
        apiErrorMessage(
          error,
          "Could not delete your account. Please try again or contact support.",
        ),
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    if (isDeletingAccount) return;

    Alert.alert(
      "Delete Account?",
      "This permanently deletes your account and all wallets, transactions, categories, budgets and reminders. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => void performAccountDeletion(),
        },
      ],
    );
  };

  const handleOpenLegalPage = async (
    page: "privacy" | "terms" | "account-deletion",
  ) => {
    hapticFeedback.light();
    try {
      await openLegalPage(page);
    } catch (error) {
      Alert.alert(
        "Unavailable",
        error instanceof Error
          ? error.message
          : "Could not open this page right now.",
      );
    }
  };

  const displayEmail = useMemo(
    () => displayableEmail(user?.email),
    [user?.email],
  );

  const userInitials = useMemo(
    () => getInitials(user?.name, user?.email),
    [user],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header
        title="Profile & Settings"
        subtitle="Manage your account and preferences"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarSpace },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* User Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarRing}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                  accessibilityLabel="User avatar"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </View>
              )}
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || "Monevo User"}
              </Text>
              <Text
                style={styles.userEmail}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {displayEmail ?? "Personal account"}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowEditProfileModal(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Edit profile name"
            >
              <Ionicons name="pencil" size={15} color={colors.primary} />
            </Pressable>
          </View>

          {/* Mini Stats Bar */}
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={[styles.statCol, styles.statColWide]}>
              <Text style={styles.statLabel}>Net Worth</Text>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {hideBalance ? "••••••" : formatCurrency(totalNetWorth)}
              </Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Wallets</Text>
              <Text style={styles.statValue}>{wallets.length}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Records</Text>
              <Text style={styles.statValue}>{transactions.length}</Text>
            </View>
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={styles.sectionHeader}>Preferences</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="cash-outline"
            title="Currency"
            subtitle={currencyConfig.name}
            value={`${currencyConfig.flag} ${currencyConfig.code}`}
            onPress={() => setShowCurrencyModal(true)}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={hideBalance ? "eye-off-outline" : "eye-outline"}
            iconColor={colors.info}
            iconBgColor={colors.infoBg}
            title="Hide Balance"
            subtitle="Mask financial balances by default"
            isSwitch
            switchValue={hideBalance}
            onSwitchChange={toggleHideBalance}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="notifications-outline"
            iconColor={colors.warning}
            iconBgColor={colors.warningBg}
            title="Bill Reminders"
            subtitle="Local push notification at 9:00 AM"
            isSwitch
            switchValue={reminderNotifications}
            onSwitchChange={handleToggleNotifications}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="grid-outline"
            iconColor={colors.accent}
            iconBgColor={colors.incomeBg}
            title="Manage Categories"
            subtitle="Add custom income and expense categories"
            onPress={() => setShowCategoryModal(true)}
          />
        </Card>

        {/* Session Section */}
        <Text style={styles.sectionHeader}>Account</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your current session"
            destructive
            showChevron={false}
            onPress={handleLogout}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="trash-outline"
            title={isDeletingAccount ? "Deleting Account..." : "Delete Account"}
            subtitle="Permanently remove your account and all data"
            destructive
            showChevron={false}
            disabled={isDeletingAccount}
            onPress={handleDeleteAccount}
          />
        </Card>

        {/* Legal Section */}
        <Text style={styles.sectionHeader}>Privacy & Legal</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="shield-checkmark-outline"
            iconColor={colors.info}
            iconBgColor={colors.infoBg}
            title="Privacy Policy"
            subtitle="How we collect, use and protect your data"
            onPress={() => void handleOpenLegalPage("privacy")}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Rules for using Monevo"
            onPress={() => void handleOpenLegalPage("terms")}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="information-circle-outline"
            title="Account Deletion Info"
            subtitle="Delete in the app or request deletion online"
            onPress={() => void handleOpenLegalPage("account-deletion")}
          />
        </Card>

        <View style={styles.footerSpacing} />
      </ScrollView>

      {/* Modals */}
      <CurrencyPickerModal
        visible={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />

      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryMuted,
    marginRight: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...typography.title2,
    color: colors.surface,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    ...typography.title3,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: colors.text,
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  editButtonPressed: {
    backgroundColor: colors.primaryMuted,
    transform: [{ scale: 0.94 }],
  },
  userEmail: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statColWide: {
    flex: 1.5,
  },
  statLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
    ...typography.tabular,
  },
  statSeparator: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xs,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 70,
  },
  footerSpacing: {
    height: spacing.xl,
  },
});
