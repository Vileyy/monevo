import * as Notifications from "expo-notifications";
import {
  calculateNextReminderTriggerDate,
  cancelReminderNotification,
  REMINDER_NOTIFICATION_PREFIX,
  scheduleReminderNotification,
  syncReminderNotifications,
} from "@/lib/notifications";
import { ReminderItem } from "@/store/reminder.store";

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("mock_notif_id_123"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([
    { identifier: "monevo_reminder_old_1" },
    { identifier: "other_notif_2" },
  ]),
  SchedulableTriggerInputTypes: {
    DATE: "date",
  },
  AndroidImportance: {
    HIGH: 4,
  },
}));

describe("notifications library", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateNextReminderTriggerDate", () => {
    it("should schedule in current month if trigger date is in the future", () => {
      // Current date: 2026-08-05 10:00
      const fakeNow = new Date(2026, 7, 5, 10, 0, 0); // Month index 7 = August
      // Due on the 15th, remind 1 day before => Aug 14 at 9:00
      const trigger = calculateNextReminderTriggerDate(15, 1, 9, 0, fakeNow);

      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(7); // August
      expect(trigger.getDate()).toBe(14);
      expect(trigger.getHours()).toBe(9);
      expect(trigger.getMinutes()).toBe(0);
    });

    it("should schedule in next month if trigger date has already passed in current month", () => {
      // Current date: 2026-08-20 10:00
      const fakeNow = new Date(2026, 7, 20, 10, 0, 0); // Month index 7 = August
      // Due on the 10th, remind 1 day before (Aug 9 is passed) => Sep 9 at 9:00
      const trigger = calculateNextReminderTriggerDate(10, 1, 9, 0, fakeNow);

      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(8); // September
      expect(trigger.getDate()).toBe(9);
      expect(trigger.getHours()).toBe(9);
      expect(trigger.getMinutes()).toBe(0);
    });

    it("should clamp due date to maximum days in month", () => {
      // Current date: 2026-02-01
      const fakeNow = new Date(2026, 1, 1, 8, 0, 0); // February
      // Due on 31st (Feb only has 28 days), 0 days before => Feb 28
      const trigger = calculateNextReminderTriggerDate(31, 0, 9, 0, fakeNow);

      expect(trigger.getFullYear()).toBe(2026);
      expect(trigger.getMonth()).toBe(1); // February
      expect(trigger.getDate()).toBe(28);
    });
  });

  describe("scheduleReminderNotification", () => {
    it("should cancel existing and schedule notification for reminder", async () => {
      const mockReminder: ReminderItem = {
        id: "rem-123",
        title: "Tiền Điện",
        amount: 500000,
        dueDate: 15,
        frequency: "MONTHLY",
        category: "ELECTRICITY",
        isPaidThisMonth: false,
        daysUntilDue: 5,
        status: "DUE_SOON",
      };

      const notifId = await scheduleReminderNotification(mockReminder, 1);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        `${REMINDER_NOTIFICATION_PREFIX}rem-123`,
      );
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: `${REMINDER_NOTIFICATION_PREFIX}rem-123`,
          content: expect.objectContaining({
            title: expect.stringContaining("Tiền Điện"),
            body: expect.stringContaining("ngày 15"),
          }),
        }),
      );
      expect(notifId).toBe("mock_notif_id_123");
    });
  });

  describe("cancelReminderNotification", () => {
    it("should call cancelScheduledNotificationAsync with prefix", async () => {
      await cancelReminderNotification("rem-456");
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        `${REMINDER_NOTIFICATION_PREFIX}rem-456`,
      );
    });
  });

  describe("syncReminderNotifications", () => {
    it("should cancel old reminder notifications and schedule unpaid ones", async () => {
      const reminders: ReminderItem[] = [
        {
          id: "rem-1",
          title: "Tiền Nước",
          amount: 200000,
          dueDate: 10,
          frequency: "MONTHLY",
          isPaidThisMonth: false,
          daysUntilDue: 3,
          status: "DUE_SOON",
        },
        {
          id: "rem-2",
          title: "Tiền Net",
          amount: 300000,
          dueDate: 20,
          frequency: "MONTHLY",
          isPaidThisMonth: true, // Already paid
          daysUntilDue: 13,
          status: "PAID",
        },
      ];

      await syncReminderNotifications(reminders);

      // Cancelled the old scheduled one
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        "monevo_reminder_old_1",
      );
      // Scheduled unpaid rem-1
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: "monevo_reminder_rem-1",
        }),
      );
    });
  });
});
