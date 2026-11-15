import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Modal } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { openLegalPage } from '@/lib/legal-links';
import { hapticFeedback } from '@/lib/haptics';
import { SettingsRow } from './SettingsRow';

type LegalPage = 'privacy' | 'terms' | 'account-deletion';

export interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
}

const DOCUMENTS: {
  page: LegalPage;
  icon: 'shield-checkmark-outline' | 'document-text-outline' | 'trash-outline';
  title: string;
  subtitle: string;
  iconColor: string;
  iconBgColor: string;
}[] = [
  {
    page: 'privacy',
    icon: 'shield-checkmark-outline',
    title: 'Privacy Policy',
    subtitle: 'How we collect, use and protect your data',
    iconColor: colors.info,
    iconBgColor: colors.infoBg,
  },
  {
    page: 'terms',
    icon: 'document-text-outline',
    title: 'Terms of Service',
    subtitle: 'Rules for using Monevo',
    iconColor: colors.accent,
    iconBgColor: colors.incomeBg,
  },
  {
    page: 'account-deletion',
    icon: 'trash-outline',
    title: 'Account deletion',
    subtitle: 'What we remove and what we keep',
    iconColor: colors.danger,
    iconBgColor: colors.expenseBg,
  },
];

export function LegalModal({ visible, onClose }: LegalModalProps) {
  const handleOpen = async (page: LegalPage) => {
    hapticFeedback.light();
    onClose();
    try {
      await openLegalPage(page);
    } catch (error) {
      Alert.alert(
        'Unavailable',
        error instanceof Error
          ? error.message
          : 'Could not open this page right now.',
      );
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Legal & Privacy"
      subtitle="Open a document"
    >
      <View style={styles.list}>
        {DOCUMENTS.map((doc, index) => (
          <React.Fragment key={doc.page}>
            {index > 0 && <View style={styles.divider} />}
            <SettingsRow
              icon={doc.icon}
              iconColor={doc.iconColor}
              iconBgColor={doc.iconBgColor}
              title={doc.title}
              subtitle={doc.subtitle}
              onPress={() => void handleOpen(doc.page)}
            />
          </React.Fragment>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: spacing.lg + 40 + spacing.md,
  },
});
