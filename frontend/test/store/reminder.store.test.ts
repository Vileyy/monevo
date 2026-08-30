jest.mock("@/services/api/client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

import { apiClient } from "@/services/api/client";
import { useReminderStore } from "@/store/reminder.store";

describe("reminder.store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useReminderStore.setState({
      reminders: [],
      isLoading: false,
      error: null,
    });
  });

  it("should initialize with default state", () => {
    const state = useReminderStore.getState();
    expect(state.reminders).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  describe("fetchReminders", () => {
    it("should fetch and set reminders", async () => {
      const mockReminders = [
        {
          id: "r1",
          title: "Tiền điện",
          amount: 300000,
          dueDate: 10,
          frequency: "MONTHLY",
          category: "ELECTRICITY",
          isPaidThisMonth: false,
          daysUntilDue: 5,
          status: "UPCOMING",
        },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue({ data: mockReminders });

      await useReminderStore.getState().fetchReminders();

      const state = useReminderStore.getState();
      expect(apiClient.get).toHaveBeenCalledWith("/reminders");
      expect(state.reminders).toEqual(mockReminders);
      expect(state.isLoading).toBe(false);
    });
  });

  describe("createReminder", () => {
    it("should call api post and reload reminders", async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "r1" } });
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await useReminderStore.getState().createReminder({
        title: "Tiền thuốc",
        amount: 200000,
        dueDate: 15,
        category: "MEDICINE",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/reminders", {
        title: "Tiền thuốc",
        amount: 200000,
        dueDate: 15,
        category: "MEDICINE",
      });
    });
  });

  describe("payReminder", () => {
    it("should call pay api and refresh stores", async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: "r1" } });
      (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });

      await useReminderStore.getState().payReminder("r1", "w1");

      expect(apiClient.post).toHaveBeenCalledWith("/reminders/r1/pay", {
        walletId: "w1",
      });
    });
  });

  describe("deleteReminder", () => {
    it("should call delete api and remove from state", async () => {
      useReminderStore.setState({
        reminders: [
          {
            id: "r1",
            title: "Tiền điện",
            amount: 300000,
            dueDate: 10,
            frequency: "MONTHLY",
            isPaidThisMonth: false,
            daysUntilDue: 5,
            status: "UPCOMING",
          },
        ],
      });

      (apiClient.delete as jest.Mock).mockResolvedValue({ data: { id: "r1" } });

      await useReminderStore.getState().deleteReminder("r1");

      expect(apiClient.delete).toHaveBeenCalledWith("/reminders/r1");
      expect(useReminderStore.getState().reminders).toHaveLength(0);
    });
  });
});
