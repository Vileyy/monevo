import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { ReminderItem } from "@/store/reminder.store";
import { formatCurrency } from "@/lib/format";

// Prefix to identify Monevo reminder notifications
export const REMINDER_NOTIFICATION_PREFIX = "monevo_reminder_";

/**
 * Configure notification handler and Android channels
 */
export async function initNotifications(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("bill-reminders", {
        name: "Nhắc nhở hóa đơn & định kỳ",
        description: "Thông báo nhắc hạn đóng tiền hóa đơn",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#22C55E",
        sound: "default",
      });
    }
  } catch (error) {
    console.warn("Failed to initialize notifications:", error);
  }
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === "granted";
  } catch (error) {
    console.warn("Failed to request notification permission:", error);
    return false;
  }
}

/**
 * Calculate the next Date trigger for a reminder.
 * By default schedules at 9:00 AM on (dueDate - daysBefore) of current or next month.
 */
export function calculateNextReminderTriggerDate(
  dueDate: number,
  daysBefore: number = 1,
  hour: number = 9,
  minute: number = 0,
  now: Date = new Date(),
): Date {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Clamp dueDate to days in current month
  const daysInCurrentMonth = new Date(
    currentYear,
    currentMonth + 1,
    0,
  ).getDate();
  const validDueDay = Math.min(Math.max(1, dueDate), daysInCurrentMonth);

  // Target day is validDueDay - daysBefore
  const targetDay = Math.max(1, validDueDay - daysBefore);

  const candidateDate = new Date(
    currentYear,
    currentMonth,
    targetDay,
    hour,
    minute,
    0,
    0,
  );

  // If candidate time is already in the past, schedule for next month
  if (candidateDate.getTime() <= now.getTime()) {
    const nextMonth = currentMonth + 1;
    const daysInNextMonth = new Date(currentYear, nextMonth + 1, 0).getDate();
    const validNextDueDay = Math.min(Math.max(1, dueDate), daysInNextMonth);
    const targetNextDay = Math.max(1, validNextDueDay - daysBefore);

    return new Date(currentYear, nextMonth, targetNextDay, hour, minute, 0, 0);
  }

  return candidateDate;
}

/**
 * Schedule a local notification for a specific reminder
 */
export async function scheduleReminderNotification(
  reminder: ReminderItem,
  daysBefore: number = 1,
): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    const identifier = `${REMINDER_NOTIFICATION_PREFIX}${reminder.id}`;

    // Always cancel previous notification for this reminder
    await cancelReminderNotification(reminder.id);

    // If already paid for this month, we schedule for next month
    const now = new Date();
    const triggerDate = calculateNextReminderTriggerDate(
      reminder.dueDate,
      daysBefore,
      9,
      0,
      now,
    );

    const formattedAmount = formatCurrency(reminder.amount);
    const dueDayText = `ngày ${reminder.dueDate}`;

    const notificationId = await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `🔔 Nhắc hóa đơn: ${reminder.title}`,
        body: `Khoản ${formattedAmount} đến hạn vào ${dueDayText}. Đừng quên thanh toán đúng hạn nhé!`,
        data: {
          reminderId: reminder.id,
          amount: reminder.amount,
          dueDate: reminder.dueDate,
          type: "BILL_REMINDER",
        },
        sound: true,
        ...(Platform.OS === "android" ? { channelId: "bill-reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.warn(
      `Failed to schedule notification for reminder ${reminder.id}:`,
      error,
    );
    return null;
  }
}

/**
 * Cancel a scheduled reminder notification
 */
export async function cancelReminderNotification(
  reminderId: string,
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const identifier = `${REMINDER_NOTIFICATION_PREFIX}${reminderId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn(
      `Failed to cancel notification for reminder ${reminderId}:`,
      error,
    );
  }
}

/**
 * Synchronize all reminders with scheduled local notifications
 */
export async function syncReminderNotifications(
  reminders: ReminderItem[],
  daysBefore: number = 1,
): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    // Get all current scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    // Cancel all previous monevo reminder notifications
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(REMINDER_NOTIFICATION_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Schedule active unpaid reminders
    for (const reminder of reminders) {
      if (!reminder.isPaidThisMonth) {
        await scheduleReminderNotification(reminder, daysBefore);
      }
    }
  } catch (error) {
    console.warn("Failed to sync reminder notifications:", error);
  }
}
