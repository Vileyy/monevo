/* eslint-disable no-undef */
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  getItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
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
