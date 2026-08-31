import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const hapticFeedback = {
  light: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  },
  medium: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  },
  heavy: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
  },
  selection: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.selectionAsync();
      } catch {}
    }
  },
  success: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {}
    }
  },
  warning: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      } catch {}
    }
  },
  error: () => {
    if (Platform.OS !== "web") {
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  },
};
