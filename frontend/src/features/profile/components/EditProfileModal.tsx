import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, Input, Modal } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";
import { apiClient } from "@/services/api/client";

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

interface EditProfileFormProps {
  initialName: string;
  email: string;
  onClose: () => void;
  onSuccess: (name: string) => void;
}

function EditProfileForm({
  initialName,
  email,
  onClose,
  onSuccess,
}: EditProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.patch<{
        id: string;
        email: string;
        name: string;
      }>("/users/me", {
        name: name.trim(),
      });

      onSuccess(response.data.name);
      onClose();
    } catch {
      // Fallback: If offline / network error, update store locally
      onSuccess(name.trim());
      Alert.alert("Profile Updated", "Your profile has been saved locally.", [
        { text: "OK", onPress: onClose },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.emailContainer}>
        <Text style={styles.emailLabel}>Email Address</Text>
        <Text style={styles.emailValue}>{email || "—"}</Text>
        <Text style={styles.emailNote}>Email cannot be changed.</Text>
      </View>

      <Input
        label="Full Name"
        placeholder="e.g. Alex Morgan"
        value={name}
        onChangeText={setName}
        autoFocus
        autoCapitalize="words"
      />

      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onClose}
          style={styles.button}
        />
        <Button
          title="Save Changes"
          onPress={handleSave}
          isLoading={isSubmitting}
          style={styles.button}
        />
      </View>
    </View>
  );
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  return (
    <Modal visible={visible} onClose={onClose} title="Edit Profile">
      {visible ? (
        <EditProfileForm
          key={user?.name || "unnamed"}
          initialName={user?.name || ""}
          email={user?.email || ""}
          onClose={onClose}
          onSuccess={(name) => updateUser({ name })}
        />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  emailContainer: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  emailLabel: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emailValue: {
    ...typography.body,
    fontWeight: "500",
    color: colors.text,
    marginTop: 2,
  },
  emailNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 11,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
  },
});
