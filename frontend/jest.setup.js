/* eslint-disable no-undef */
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("mock_notif_id_123"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  SchedulableTriggerInputTypes: {
    DATE: "date",
  },
  AndroidImportance: {
    HIGH: 4,
  },
}));

jest.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: jest.fn((dict) => dict.ios || dict.default),
  },
}));

jest.mock("@clerk/clerk-expo", () => ({
  ClerkProvider: ({ children }) => children,
  ClerkLoaded: ({ children }) => children,
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: jest.fn(),
      prepareFirstFactor: jest.fn(),
      attemptFirstFactor: jest.fn(),
    },
    setActive: jest.fn(),
  }),
  useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
    },
    setActive: jest.fn(),
  }),
  useOAuth: () => ({
    startOAuthFlow: jest.fn(),
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: "test_user_1",
    getToken: jest.fn().mockResolvedValue("test_token"),
    signOut: jest.fn(),
  }),
  useUser: () => ({
    user: {
      id: "test_user_1",
      emailAddresses: [{ emailAddress: "test@example.com" }],
      fullName: "Test User",
    },
  }),
}));
