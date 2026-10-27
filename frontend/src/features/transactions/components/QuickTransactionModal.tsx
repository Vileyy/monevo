import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, radius, spacing, typography } from '@/theme';
import {
  Button,
  CategoryIcon,
  CurrencyInput,
  IconBadge,
  Input,
  Modal,
  SegmentedControl,
  WalletIcon,
} from '@/components/ui';
import { parseVndInput } from '@/lib/format';
import { apiErrorMessage } from '@/lib/api-error';
import { hapticFeedback } from '@/lib/haptics';
import { calculateBudgetWarning } from '@/lib/budget-warning';
import { useWalletStore } from '@/store/wallet.store';
import { Category, useCategoryStore } from '@/store/category.store';
import { useTransactionStore } from '@/store/transaction.store';
import { useBudgetStore } from '@/store/budget.store';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import {
  normalizeQuickNote,
  resolveCategoryId,
  resolveWalletId,
  validateQuickAmount,
} from '@/features/transactions/utils/quick-transaction';

export interface QuickTransactionModalProps {
  visible: boolean;
  initialType: 'INCOME' | 'EXPENSE';
  onClose: () => void;
  onSaved?: () => void;
}

export function QuickTransactionModal({
  visible,
  initialType,
  onClose,
  onSaved,
}: QuickTransactionModalProps) {
  const router = useRouter();
  const { wallets, fetchWallets } = useWalletStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { createTransaction, fetchTransactions } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();

  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const noteFocusedRef = useRef(false);
  const [wasVisible, setWasVisible] = useState(visible);

  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (visible) {
      setType(initialType);
    } else if (creatingCategory) {
      setCreatingCategory(false);
    }
  }

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (visible && noteFocusedRef.current) {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    });
    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    void Promise.all([fetchWallets(), fetchCategories(), fetchBudgets()]);
  }, [visible, fetchWallets, fetchCategories, fetchBudgets]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const selectedWalletId = resolveWalletId(wallets, walletId);
  const selectedCategoryId = resolveCategoryId(categories, categoryId, type);

  const matchingBudget = useMemo(() => {
    if (type !== 'EXPENSE' || !selectedCategoryId) return undefined;
    return budgets.find((budget) => budget.categoryId === selectedCategoryId);
  }, [type, selectedCategoryId, budgets]);

  const budgetWarning = useMemo(() => {
    if (type !== 'EXPENSE' || !matchingBudget) return null;
    return calculateBudgetWarning(matchingBudget, parseVndInput(amount) || 0);
  }, [type, matchingBudget, amount]);

  const isReady = Boolean(selectedWalletId && selectedCategoryId);

  const persist = async (amountToSave: number) => {
    if (!selectedWalletId || !selectedCategoryId) return;

    setIsSubmitting(true);
    try {
      await createTransaction({
        amount: amountToSave,
        type,
        note: normalizeQuickNote(note),
        walletId: selectedWalletId,
        categoryId: selectedCategoryId,
      });

      hapticFeedback.success();
      await Promise.all([fetchWallets(), fetchTransactions(), fetchBudgets()]);
      onSaved?.();
      onClose();
    } catch (error) {
      hapticFeedback.error();
      Alert.alert(
        'Error',
        apiErrorMessage(error, 'Could not save transaction.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    const validAmount = parseVndInput(amount);
    const amountError = validateQuickAmount(validAmount);
    if (amountError) {
      hapticFeedback.warning();
      Alert.alert('Invalid Amount', amountError);
      return;
    }

    if (!isReady) {
      hapticFeedback.warning();
      Alert.alert(
        'Missing Details',
        'Select an account and category before saving.',
      );
      return;
    }

    if (budgetWarning?.status === 'EXCEEDED') {
      hapticFeedback.warning();
      Alert.alert(
        'Budget Limit Exceeded',
        `${budgetWarning.message}\n\nDo you still want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed',
            style: 'destructive',
            onPress: () => {
              void persist(validAmount);
            },
          },
        ],
      );
      return;
    }

    void persist(validAmount);
  };

  const handleCategoryCreated = (category: Category) => {
    hapticFeedback.success();
    setCategoryId(category.id);
    setCreatingCategory(false);
  };

  const openFullForm = () => {
    hapticFeedback.light();
    onClose();
    router.push('/add-transaction');
  };

  const isIncome = type === 'INCOME';

  return (
    <Modal
      visible={visible}
      onClose={creatingCategory ? () => setCreatingCategory(false) : onClose}
      title={
        creatingCategory
          ? 'New Category'
          : isIncome
            ? 'Add income'
            : 'Add expense'
      }
      subtitle={
        creatingCategory
          ? 'Create a custom spending or income category'
          : 'Saved to your records instantly'
      }
      scrollViewRef={scrollRef}
    >
      {creatingCategory ? (
        <CategoryForm
          type={type}
          onTypeChange={setType}
          onCreated={handleCategoryCreated}
        />
      ) : (
        <>
          <SegmentedControl
            options={[
              {
                value: 'INCOME',
                label: 'Money in',
                activeColor: colors.income,
                activeBgColor: colors.incomeBg,
              },
              {
                value: 'EXPENSE',
                label: 'Money out',
                activeColor: colors.expense,
                activeBgColor: colors.expenseBg,
              },
            ]}
            value={type}
            onChange={(nextType) => {
              hapticFeedback.selection();
              setType(nextType);
            }}
            style={styles.segments}
          />

          <CurrencyInput
            value={amount}
            onChangeText={setAmount}
            type={type}
            autoFocus={visible}
          />

          {wallets.length === 0 ? (
            <View style={styles.setupCard}>
              <Text style={styles.setupTitle}>No account yet</Text>
              <Text style={styles.setupText}>
                Open the full form to set up your account first.
              </Text>
              <Button
                title="Open full form"
                variant="outline"
                size="sm"
                onPress={openFullForm}
                style={styles.setupButton}
              />
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Category</Text>
              {visibleCategories.length === 0 && (
                <Text style={styles.emptyHint}>
                  No category yet. Tap New to name one and pick its icon.
                </Text>
              )}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                keyboardShouldPersistTaps="handled"
              >
                {visibleCategories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      onPress={() => {
                        hapticFeedback.selection();
                        setCategoryId(category.id);
                      }}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        isSelected && styles.categoryChipSelected,
                        pressed && styles.chipPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <CategoryIcon
                        type={type}
                        icon={category.icon}
                        size="sm"
                      />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => {
                    hapticFeedback.light();
                    setCreatingCategory(true);
                  }}
                  style={({ pressed }) => [
                    styles.categoryChip,
                    styles.addChip,
                    pressed && styles.chipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="New category"
                >
                  <IconBadge
                    icon="add"
                    color={colors.textSecondary}
                    backgroundColor={colors.surfaceSecondary}
                    size="sm"
                  />
                  <Text style={styles.addChipText}>New</Text>
                </Pressable>
              </ScrollView>

              <Text style={styles.fieldLabel}>
                {isIncome ? 'Add to' : 'Record from'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
                keyboardShouldPersistTaps="handled"
              >
                {wallets.map((wallet) => {
                  const isSelected = wallet.id === selectedWalletId;
                  return (
                    <Pressable
                      key={wallet.id}
                      onPress={() => {
                        hapticFeedback.selection();
                        setWalletId(wallet.id);
                      }}
                      style={({ pressed }) => [
                        styles.walletChip,
                        isSelected && styles.walletChipSelected,
                        pressed && styles.chipPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <WalletIcon type={wallet.type} size="xs" />
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {wallet.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <Input
                placeholder={
                  isIncome
                    ? 'e.g. October salary, Freelance project'
                    : 'e.g. Lunch with team, Taxi ride'
                }
                value={note}
                onChangeText={setNote}
                onFocus={() => {
                  noteFocusedRef.current = true;
                }}
                onBlur={() => {
                  noteFocusedRef.current = false;
                }}
                maxLength={140}
                returnKeyType="done"
                leftIcon={
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={18}
                    color={colors.textMuted}
                  />
                }
              />

              {type === 'EXPENSE' &&
                budgetWarning &&
                (budgetWarning.status === 'WARNING' ||
                  budgetWarning.status === 'EXCEEDED') && (
                  <View
                    style={[
                      styles.warningRow,
                      budgetWarning.status === 'EXCEEDED' &&
                        styles.warningRowDanger,
                    ]}
                  >
                    <Ionicons
                      name={
                        budgetWarning.status === 'EXCEEDED'
                          ? 'alert-circle'
                          : 'information-circle'
                      }
                      size={16}
                      color={
                        budgetWarning.status === 'EXCEEDED'
                          ? colors.danger
                          : colors.warning
                      }
                    />
                    <Text
                      style={[
                        styles.warningText,
                        budgetWarning.status === 'EXCEEDED' &&
                          styles.warningTextDanger,
                      ]}
                      numberOfLines={2}
                    >
                      {budgetWarning.message}
                    </Text>
                  </View>
                )}

              <Button
                title={isIncome ? 'Add income' : 'Add expense'}
                onPress={handleSave}
                isLoading={isSubmitting}
                disabled={!isReady}
                size="lg"
                style={
                  isIncome ? styles.saveIncomeButton : styles.saveExpenseButton
                }
              />
              <Pressable
                onPress={openFullForm}
                style={styles.moreLink}
                accessibilityRole="button"
              >
                <Text style={styles.moreLinkText}>
                  Add a date or more details
                </Text>
              </Pressable>
            </>
          )}
        </>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  segments: {
    marginBottom: spacing.base,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
    marginBottom: spacing.base,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  categoryChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  addChip: {
    borderStyle: 'dashed',
  },
  addChipText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    maxWidth: 180,
  },
  walletChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.base,
  },
  warningRowDanger: {
    backgroundColor: colors.expenseBg,
  },
  warningText: {
    ...typography.caption,
    color: '#92400E',
    flex: 1,
    lineHeight: 17,
  },
  warningTextDanger: {
    color: colors.danger,
  },
  saveIncomeButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.income,
  },
  saveExpenseButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.expense,
  },
  moreLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  moreLinkText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  setupCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  setupTitle: {
    ...typography.subhead,
    color: colors.text,
    fontWeight: '700',
  },
  setupText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  setupButton: {
    marginTop: spacing.sm,
  },
});
