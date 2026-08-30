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
