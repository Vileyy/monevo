import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Input, SegmentedControl } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-error';
import { hapticFeedback } from '@/lib/haptics';
import { CATEGORY_ICON_OPTIONS, IconName } from '@/lib/categories';
import { Category, useCategoryStore } from '@/store/category.store';

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface CategoryFormProps {
  type: CategoryType;
  onTypeChange: (type: CategoryType) => void;
  onCreated?: (category: Category) => void;
}

export function CategoryForm({
  type,
  onTypeChange,
  onCreated,
}: CategoryFormProps) {
  const { createCategory } = useCategoryStore();

  const [name, setName] = useState('');
  const [pickedIcon, setPickedIcon] = useState<IconName | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedIcon =
    pickedIcon ?? (type === 'INCOME' ? 'cash' : 'restaurant');

  const handleTypeChange = (nextType: CategoryType) => {
    hapticFeedback.selection();
    onTypeChange(nextType);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a category name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createCategory(name.trim(), type, selectedIcon);
      setName('');
      setPickedIcon(null);
      onCreated?.(created);
    } catch (error) {
      Alert.alert(
        'Error',
        apiErrorMessage(error, 'Could not create category.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.segmentWrapper}>
        <SegmentedControl
          options={[
            { value: 'EXPENSE', label: 'Expense' },
            { value: 'INCOME', label: 'Income' },
          ]}
          value={type}
          onChange={handleTypeChange}
        />
      </View>

      <Input
        label="Category Name"
        placeholder="e.g. Coffee, Gym, Rent"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <View style={styles.iconSection}>
        <Text style={styles.sectionLabel}>Select Icon</Text>
        <View style={styles.iconGrid}>
          {CATEGORY_ICON_OPTIONS.map((item) => {
            const isSelected = selectedIcon === item.icon;
            return (
              <Pressable
                key={item.icon}
                onPress={() => setPickedIcon(item.icon)}
                style={[
                  styles.iconTile,
                  { backgroundColor: item.bgColor },
                  isSelected && styles.iconTileSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title="Create Category"
        onPress={handleSave}
        isLoading={isSubmitting}
        size="lg"
        style={styles.submitBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: spacing.xs,
  },
  segmentWrapper: {
    marginBottom: spacing.base,
  },
  iconSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    justifyContent: 'center',
  },
  iconTile: {
    width: 46,
    height: 46,
    borderRadius: radius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconTileSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.06 }],
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
});
