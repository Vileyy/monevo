import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useBankSyncStore } from '@/store/bank-sync.store';
import { openNotificationListenerSettings } from '../services/notificationListener';
import { SUPPORTED_BANKS } from '../utils/bankParsers';
import { colors, radius, spacing, typography } from '@/theme';
import { hapticFeedback } from '@/lib/haptics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function BankSyncModal({ visible, onClose }: Props) {
  const { isEnabled, autoSave, setEnabled, setAutoSave } = useBankSyncStore();

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

        {/* Android Permission Guidance Card */}
        <Card style={styles.card}>
          <View style={styles.permissionHeader}>
            <Ionicons
              name="shield-checkmark"
              size={20}
              color={colors.info}
              style={{ marginRight: spacing.xs }}
            />
            <Text style={styles.permissionTitle}>
              Cấp quyền truy cập trên Android
            </Text>
          </View>
          <Text style={styles.permissionDesc}>
            Android yêu cầu cho phép quyền đọc thông báo để Monevo phát hiện
            biến động số dư từ app ngân hàng của bạn. Dữ liệu được xử lý 100%
            tại máy, tuyệt đối bảo mật.
          </Text>
          <Button
            title="Mở cài đặt quyền thông báo"
            variant="outline"
            size="sm"
            style={styles.permissionBtn}
            onPress={handleOpenAndroidSettings}
          />
        </Card>

        {/* Supported Banks Badges */}
        <Text style={styles.sectionHeader}>Ứng dụng ngân hàng được hỗ trợ</Text>
        <Card style={styles.card}>
          <Text style={styles.supportedDesc}>
            Monevo tự động nhận diện thông báo từ các ngân hàng và tự động gán
            vào ví tương ứng trong sổ chi tiêu của bạn:
          </Text>
          <View style={styles.bankChipsContainer}>
            {supportedBankList.map((bank) => (
              <View key={bank.code} style={styles.bankChip}>
                <View
                  style={[styles.bankDot, { backgroundColor: bank.brandColor }]}
                />
                <Text style={styles.bankChipText}>{bank.name}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
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
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  textCol: {
    flex: 1,
  },
  rowTitle: {
    ...typography.body,
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
    marginVertical: spacing.md,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  permissionTitle: {
    ...typography.subhead,
    fontWeight: '600',
    color: colors.text,
  },
  permissionDesc: {
    ...typography.footnote,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  permissionBtn: {
    alignSelf: 'flex-start',
  },
  supportedDesc: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  bankChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bankDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  bankChipText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '500',
  },
});
