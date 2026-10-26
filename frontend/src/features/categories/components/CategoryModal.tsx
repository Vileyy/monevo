import React, { useState } from 'react';
import { Modal } from '@/components/ui';
import { Category } from '@/store/category.store';
import {
  CategoryForm,
  CategoryType,
} from '@/features/categories/components/CategoryForm';

export interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: CategoryType;
  onCreated?: (category: Category) => void;
}

export function CategoryModal({
  visible,
  onClose,
  initialType = 'EXPENSE',
  onCreated,
}: CategoryModalProps) {
  const [type, setType] = useState<CategoryType>(initialType);
  const [wasVisible, setWasVisible] = useState(visible);

  if (wasVisible !== visible) {
    setWasVisible(visible);
    if (visible) setType(initialType);
  }

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="New Category"
      subtitle="Create a custom spending or income category"
    >
      <CategoryForm
        type={type}
        onTypeChange={setType}
        onCreated={(created) => {
          onCreated?.(created);
          onClose();
        }}
      />
    </Modal>
  );
}
