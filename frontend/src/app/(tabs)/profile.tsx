import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useWalletStore } from "@/store/wallet.store";
import { useTransactionStore } from "@/store/transaction.store";
import { useReminderStore } from "@/store/reminder.store";
import { useSettingsStore } from "@/store/settings.store";
import { getCurrencyConfig } from "@/lib/currencies";
import { formatCurrency } from "@/lib/format";
import { colors, radius, shadows, spacing, typography } from "@/theme";
import { Card, Header } from "@/components/ui";
import { SettingsRow } from "@/features/profile/components/SettingsRow";
import { CurrencyPickerModal } from "@/features/profile/components/CurrencyPickerModal";
import { EditProfileModal } from "@/features/profile/components/EditProfileModal";
import { CategoryModal } from "@/features/categories/components/CategoryModal";
import { apiClient } from "@/services/api/client";
import {
  requestNotificationPermission,
  syncReminderNotifications,
} from "@/lib/notifications";
import { hapticFeedback } from "@/lib/haptics";

export default function ProfileScreen() {
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
  const [serverStatus, setServerStatus] = useState<
    "online" | "offline" | "checking"
  >("checking");

  const handleToggleNotifications = async () => {
    hapticFeedback.selection();
    if (!reminderNotifications) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setReminderNotifications(true);
        void syncReminderNotifications(reminders);
        Alert.alert(
          "Đã bật thông báo",
          "Ứng dụng sẽ gửi thông báo nhắc nhở trước ngày đến hạn của hóa đơn lúc 9:00 sáng.",
        );
      } else {
        Alert.alert(
          "Quyền thông báo bị từ chối",
          "Vui lòng vào Cài đặt của điện thoại để cho phép ứng dụng gửi thông báo.",
        );
      }
    } else {
      setReminderNotifications(false);
      void syncReminderNotifications([]);
    }
  };

  const checkHealth = useCallback(async () => {
    try {
      setServerStatus("checking");
      await apiClient.get("/health", { timeout: 4000 });
      setServerStatus("online");
    } catch {
      setServerStatus("offline");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/health", { timeout: 4000 })
      .then(() => {
        if (isMounted) setServerStatus("online");
      })
      .catch(() => {
        if (isMounted) setServerStatus("offline");
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWallets(), fetchTransactions(), checkHealth()]);
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
        onPress: () => logout(),
      },
    ]);
  };

  const userInitials = useMemo(() => {
    if (user?.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "ME";
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <Header title="Profile & Settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || "Monevo User"}
                </Text>
                <Pressable
                  onPress={() => setShowEditProfileModal(true)}
                  hitSlop={8}
                  style={styles.editButton}
                  accessibilityLabel="Edit profile name"
                >
                  <Ionicons name="pencil" size={14} color={colors.primary} />
                </Pressable>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || "No email"}
              </Text>
            </View>
          </View>

          {/* Mini Stats Bar */}
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Net Worth</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {hideBalance ? "••••••••" : formatCurrency(totalNetWorth)}
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
            subtitle="Display currency across the app"
            value={`${currencyConfig.flag} ${currencyConfig.code} (${currencyConfig.symbol})`}
            onPress={() => setShowCurrencyModal(true)}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon={hideBalance ? "eye-off-outline" : "eye-outline"}
            title="Hide Balance"
            subtitle="Mask financial balances by default"
            isSwitch
            switchValue={hideBalance}
            onSwitchChange={toggleHideBalance}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="notifications-outline"
            title="Bill Reminders"
            subtitle="Local push notification at 9:00 AM"
            isSwitch
            switchValue={reminderNotifications}
            onSwitchChange={handleToggleNotifications}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="grid-outline"
            title="Manage Categories"
            subtitle="Add custom income and expense categories"
            onPress={() => setShowCategoryModal(true)}
          />
        </Card>

        {/* System & Support Section */}
        <Text style={styles.sectionHeader}>System & App</Text>
        <Card style={styles.sectionCard}>
          <SettingsRow
            icon="server-outline"
            title="API Server Status"
            subtitle={
              serverStatus === "online"
                ? "Backend connected & operational"
                : serverStatus === "checking"
                  ? "Checking connection..."
                  : "Unable to reach server"
            }
            value={
              serverStatus === "online"
                ? "● Online"
                : serverStatus === "checking"
                  ? "Checking"
                  : "Offline"
            }
            showChevron={false}
            onPress={checkHealth}
          />
          <View style={styles.rowDivider} />
          <SettingsRow
            icon="information-circle-outline"
            title="App Version"
            subtitle="Monevo Personal Finance"
            value="v1.0.0"
            showChevron={false}
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
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    ...shadows.sm,
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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  userName: {
    ...typography.title3,
    fontWeight: "700",
    color: colors.text,
  },
  editButton: {
    backgroundColor: colors.primaryLight,
    padding: 4,
    borderRadius: radius.full,
  },
  userEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  statValue: {
    ...typography.bodyBold,
    color: colors.text,
  },
  statSeparator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
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
    marginLeft: 62,
  },
  footerSpacing: {
    height: spacing.xl,
  },
});
