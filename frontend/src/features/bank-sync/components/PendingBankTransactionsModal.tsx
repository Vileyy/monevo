import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CategorySelectorModal } from '@/features/categories/components/CategorySelectorModal';
import { WalletSelectorModal } from '@/features/wallets/components/WalletSelectorModal';
import { useBankSyncStore } from '@/store/bank-sync.store';
import { useWalletStore, Wallet } from '@/store/wallet.store';
import { Category, useCategoryStore } from '@/store/category.store';
import { formatCurrency } from '@/lib/format';
import { colors, radius, spacing, typography } from '@/theme';
import { SUPPORTED_BANKS } from '../utils/bankParsers';
import { PendingBankTransaction } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  initialPendingId?: string | null;
}

interface ItemReviewProps {
  item: PendingBankTransaction;
  wallets: Wallet[];
  categories: Category[];
  isSubmitting: boolean;
  onConfirm: (
    walletId: string | null,
    categoryId: string | null,
    note: string,
  ) => void;
  onDismiss: () => void;
}

function PendingItemReview({
  item,
  wallets,
  categories,
  isSubmitting,
  onConfirm,
  onDismiss,
}: ItemReviewProps) {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
    item.targetWalletId || wallets[0]?.id || null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    item.targetCategoryId || categories[0]?.id || null,
  );
  const [noteText, setNoteText] = useState(item.note || '');
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const bankMeta = SUPPORTED_BANKS[item.bankCode] || SUPPORTED_BANKS.GENERIC;
  const isIncome = item.type === 'INCOME';
  const sign = isIncome ? '+' : '-';
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountBg = isIncome ? colors.incomeBg : colors.expenseBg;

  const currentWallet = wallets.find((w) => w.id === selectedWalletId);
  const currentCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <View style={styles.container}>
      {/* Bank Badge & Time */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.bankBadge,
            {
              backgroundColor: bankMeta.badgeBg,
              borderColor: bankMeta.brandColor,
            },
          ]}
        >
          <Text style={[styles.bankBadgeText, { color: bankMeta.brandColor }]}>
            {bankMeta.name}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Large Amount Display */}
      <View style={[styles.amountContainer, { backgroundColor: amountBg }]}>
        <Text style={styles.amountLabel}>
          {isIncome ? 'Biến động số dư tăng' : 'Biến động số dư giảm'}
        </Text>
        <Text style={[styles.amountValue, { color: amountColor }]}>
          {sign}
          {formatCurrency(item.amount)}
        </Text>
      </View>

      {/* Editable Note */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Nội dung giao dịch</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.fieldIcon}
          />
          <TextInput
            style={styles.textInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Nhập ghi chú cho giao dịch"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      {/* Select Wallet */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Ghi vào ví</Text>
        <Pressable
          style={styles.selectorCard}
          onPress={() => setShowWalletPicker(true)}
        >
          <View style={styles.selectorLeft}>
            <View style={styles.selectorIconBg}>
              <Ionicons
                name="wallet-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <Text style={styles.selectorText}>
              {currentWallet?.name || 'Chọn ví thanh toán'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Select Category */}
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Danh mục</Text>
        <Pressable
          style={styles.selectorCard}
          onPress={() => setShowCategoryPicker(true)}
        >
          <View style={styles.selectorLeft}>
            <View style={styles.selectorIconBg}>
              <Ionicons name="grid-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.selectorText}>
              {currentCategory?.name || 'Chọn danh mục'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <Button
          title="Bỏ qua"
          variant="outline"
          style={styles.dismissBtn}
          onPress={onDismiss}
        />
        <Button
          title="Lưu giao dịch"
          style={styles.confirmBtn}
          isLoading={isSubmitting}
          onPress={() =>
            onConfirm(selectedWalletId, selectedCategoryId, noteText)
          }
        />
      </View>

      {/* Wallet Selector Sub-modal */}
      <WalletSelectorModal
        visible={showWalletPicker}
        onClose={() => setShowWalletPicker(false)}
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelectWallet={(walletId) => {
          setSelectedWalletId(walletId);
          setShowWalletPicker(false);
        }}
      />

      {/* Category Selector Sub-modal */}
      <CategorySelectorModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        initialType={item.type}
        onSelectCategory={(c) => {
          setSelectedCategoryId(c.id);
          setShowCategoryPicker(false);
        }}
      />
    </View>
  );
}

export function PendingBankTransactionsModal({
  visible,
  onClose,
  initialPendingId,
}: Props) {
  const {
    pendingTransactions,
    confirmPendingTransaction,
    dismissPendingTransaction,
  } = useBankSyncStore();
  const { wallets } = useWalletStore();
  const { categories } = useCategoryStore();

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialPendingId) {
      const idx = pendingTransactions.findIndex(
        (p) => p.id === initialPendingId,
      );
      if (idx !== -1) return idx;
    }
    return 0;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const safeIndex =
    currentIndex < pendingTransactions.length
      ? currentIndex
      : Math.max(0, pendingTransactions.length - 1);
  const currentItem = pendingTransactions[safeIndex] || null;

  if (!currentItem) {
    return null;
  }

  const handleConfirm = async (
    walletId: string | null,
    categoryId: string | null,
    note: string,
  ) => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await confirmPendingTransaction(currentItem.id, {
        walletId: walletId || undefined,
        categoryId: categoryId || undefined,
        note: note.trim(),
      });

      if (pendingTransactions.length <= 1) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    if (!currentItem) return;
    dismissPendingTransaction(currentItem.id);
    if (pendingTransactions.length <= 1) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible && Boolean(currentItem)}
      onClose={onClose}
      title="Giao dịch từ thông báo"
      subtitle={
        pendingTransactions.length > 1
          ? `Mục ${safeIndex + 1} trên ${pendingTransactions.length} giao dịch cần duyệt`
          : 'Xác nhận để ghi chép vào sổ chi tiêu'
      }
    >
      <PendingItemReview
        key={currentItem.id}
        item={currentItem}
        wallets={wallets}
        categories={categories}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirm}
        onDismiss={handleDismiss}
      />

      {/* Pagination across multiple items */}
      {pendingTransactions.length > 1 && (
        <View style={styles.paginationRow}>
          <Pressable
            disabled={safeIndex === 0}
            onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            style={[
              styles.pageArrow,
              safeIndex === 0 && styles.pageArrowDisabled,
            ]}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.pageText}>
            {safeIndex + 1} / {pendingTransactions.length}
          </Text>
          <Pressable
            disabled={safeIndex >= pendingTransactions.length - 1}
            onPress={() =>
              setCurrentIndex((prev) =>
                Math.min(pendingTransactions.length - 1, prev + 1),
              )
            }
            style={[
              styles.pageArrow,
              safeIndex >= pendingTransactions.length - 1 &&
                styles.pageArrowDisabled,
            ]}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bankBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  bankBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  timestamp: {
    ...typography.caption,
    color: colors.textMuted,
  },
  amountContainer: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  amountLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    ...typography.title1,
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  fieldIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  selectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorIconBg: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectorText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
    gap: spacing.md,
  },
  pageArrow: {
    padding: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
  },
  pageArrowDisabled: {
    opacity: 0.3,
  },
  pageText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dismissBtn: {
    flex: 1,
  },
  confirmBtn: {
    flex: 2,
  },
});
