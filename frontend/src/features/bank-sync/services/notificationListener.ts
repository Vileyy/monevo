import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Open Android system settings directly to the Notification Access screen
 */
export async function openNotificationListenerSettings(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    try {
      await Linking.openSettings();
      return true;
    } catch {
      return false;
    }
  }

  try {
    // Try opening Android Notification Listener Settings Intent
    await Linking.sendIntent(
      'android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS',
    );
    return true;
  } catch (intentErr) {
    console.warn(
      'Could not open ACTION_NOTIFICATION_LISTENER_SETTINGS, falling back to openSettings',
      intentErr,
    );
    try {
      await Linking.openSettings();
      return true;
    } catch (fallbackErr) {
      console.warn('Could not open settings', fallbackErr);
      return false;
    }
  }
}

/**
 * Listener for user interaction with Monevo bank sync prompt notifications
 */
export function setupBankSyncNotificationHandler(
  onSelectPending: (pendingId: string) => void,
): () => void {
  if (Platform.OS === 'web') return () => {};

  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data && data.type === 'BANK_SYNC_PROMPT' && data.pendingId) {
        onSelectPending(String(data.pendingId));
      }
    },
  );

  return () => {
    subscription.remove();
  };
}
