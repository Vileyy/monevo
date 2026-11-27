import {
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import type { RawNotificationPayload } from '../types';

interface NativeBankNotificationModule {
  isPermissionGranted(): Promise<boolean>;
  consumeQueuedNotifications(): Promise<RawNotificationPayload[]>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

const nativeBankModule =
  Platform.OS === 'android'
    ? (NativeModules.BankNotificationModule as
        NativeBankNotificationModule | undefined)
    : undefined;

export async function isNotificationListenerEnabled(): Promise<boolean> {
  if (!nativeBankModule?.isPermissionGranted) return false;
  try {
    return await nativeBankModule.isPermissionGranted();
  } catch {
    return false;
  }
}

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
 * Subscribe to real-time bank notifications from the Android
 * NotificationListenerService and drain any queued while the app was closed.
 */
export function setupNativeBankNotificationListener(
  onNotification: (payload: RawNotificationPayload) => void,
): () => void {
  if (!nativeBankModule) return () => {};

  const drainQueue = () => {
    void nativeBankModule
      .consumeQueuedNotifications()
      .then((items) => {
        for (const item of items) {
          onNotification(item);
        }
      })
      .catch(() => {});
  };

  drainQueue();

  const emitter = new NativeEventEmitter(nativeBankModule);
  const eventSub = emitter.addListener(
    'onBankNotification',
    (payload: RawNotificationPayload) => {
      onNotification(payload);
    },
  );

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      drainQueue();
    }
  });

  return () => {
    eventSub.remove();
    appStateSub.remove();
  };
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
