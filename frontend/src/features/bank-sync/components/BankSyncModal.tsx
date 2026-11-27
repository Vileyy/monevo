import React, { useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { useBankSyncStore } from '@/store/bank-sync.store';
import {
  isNotificationListenerEnabled,
  openNotificationListenerSettings,
} from '../services/notificationListener';
import { SUPPORTED_BANKS } from '../utils/bankParsers';
import { BankIcon } from './BankIcon';
import { colors, radius, spacing, typography } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BankSyncModal({ visible, onClose }: Props) {
  const { isEnabled, autoSave, setEnabled, setAutoSave } = useBankSyncStore();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    let cancelled = false;

    const checkPermission = () => {
      void isNotificationListenerEnabled().then((granted) => {
        if (!cancelled) setHasPermission(granted);
      });
    };

    checkPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermission();
      }
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [visible]);

  const handleToggleEnable = (value: boolean) => {
    hapticFeedback.selection();
    setEnabled(value);
  };

  const handleToggleAutoSave = (value: boolean) => {
    hapticFeedback.selection();
    setAutoSave(value);
  };

  const handleOpenAndroidSettings = async () => {
    hapticFeedback.selection();
    const success = await openNotificationListenerSettings();
    if (!success) {
      Alert.alert(
        'Cài đặt hệ thống',
        'Vui lòng mở Cài đặt máy > Ứng dụng > Quyền đặc biệt > Quyền truy cập thông báo và cho phép Monevo.',
      );
    }
  };

  const supportedBankList = Object.values(SUPPORTED_BANKS).filter(
    (b) => b.code !== 'GENERIC',
  );

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Đồng bộ thông báo ngân hàng"
      subtitle="Tự động nhận diện thu chi khi chuyển khoản hoặc nhận tiền"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Controls Card */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBg,
                  { backgroundColor: colors.primaryMuted },
                ]}
              >
                <Ionicons
                  name="notifications"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Tự động nhận diện</Text>
                <Text style={styles.rowSubtitle}>
                  Đọc biến động số dư từ thông báo app ngân hàng
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={handleToggleEnable}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[styles.iconBg, { backgroundColor: colors.incomeBg }]}
              >
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={colors.income}
                />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.rowTitle}>Tự động lưu vào ví ngay</Text>
                <Text style={styles.rowSubtitle}>
                  Cộng/trừ tiền tức thì, không cần mở app bấm xác nhận
                </Text>
              </View>
            </View>
            <Switch
              value={autoSave}
              onValueChange={handleToggleAutoSave}
              trackColor={{ false: colors.border, true: colors.income }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>

        {/* Android Permission Row */}
        <Card style={styles.permissionCard}>
          <Pressable
            onPress={handleOpenAndroidSettings}
            style={({ pressed }) => [
              styles.permissionRow,
              pressed && styles.permissionRowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mở cài đặt quyền thông báo Android"
          >
            <View style={[styles.iconBg, { backgroundColor: colors.infoBg }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.info} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.rowTitle}>Quyền đọc thông báo Android</Text>
              <Text style={styles.rowSubtitle}>
                Xử lý 100% tại máy, tuyệt đối bảo mật
              </Text>
            </View>
            <View
              style={[
                styles.permissionAction,
                hasPermission && styles.permissionActionGranted,
              ]}
            >
              <Text
                style={[
                  styles.permissionActionText,
                  hasPermission && styles.permissionActionTextGranted,
                ]}
              >
                {hasPermission ? 'Đã bật' : 'Cài đặt'}
              </Text>
              <Ionicons
                name={hasPermission ? 'checkmark-circle' : 'chevron-forward'}
                size={14}
                color={hasPermission ? colors.income : colors.primary}
              />
            </View>
          </Pressable>
        </Card>

        {/* Supported Banks Grid */}
        <Text style={styles.sectionHeader}>
          Ngân hàng & Ví hỗ trợ ({supportedBankList.length})
        </Text>
        <View style={styles.bankGrid}>
          {supportedBankList.map((bank) => (
            <View
              key={bank.code}
              style={styles.bankTile}
              accessibilityLabel={bank.name}
            >
              <BankIcon code={bank.code} width={116} height={26} />
            </View>
          ))}
        </View>

        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.base,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  permissionCard: {
    padding: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  iconBg: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
  },
  rowSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.sm + 2,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  permissionRowPressed: {
    opacity: 0.72,
  },
  permissionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  permissionActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  permissionActionGranted: {
    backgroundColor: colors.incomeBg,
  },
  permissionActionTextGranted: {
    color: colors.income,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  bankTile: {
    width: '48.5%',
    height: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
});
