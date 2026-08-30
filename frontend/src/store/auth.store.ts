import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type User = {
  id: string;
  email: string;
  name?: string;
};

const TOKEN_KEY = "monevo_jwt_token";
const USER_KEY = "monevo_user_info";

async function saveStorage(key: string, value: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  }
}

async function getStorage(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  } else {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  }
}

async function removeStorage(key: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {}
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }
}

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  restoreSession: () => Promise<void>;
  login: (user: User, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,

  restoreSession: async () => {
    try {
      const [savedToken, savedUserJson] = await Promise.all([
        getStorage(TOKEN_KEY),
        getStorage(USER_KEY),
      ]);

      if (savedToken && savedUserJson) {
        const parsedUser = JSON.parse(savedUserJson) as User;
        set({
          user: parsedUser,
          token: savedToken,
          isAuthenticated: true,
          isHydrated: true,
        });
        return;
      }
    } catch {
      // Ignored if corrupt or empty
    }
    set({ isHydrated: true });
  },

  login: (user, token) => {
    void saveStorage(TOKEN_KEY, token);
    void saveStorage(USER_KEY, JSON.stringify(user));
    set({
      user,
      token,
      isAuthenticated: true,
      isHydrated: true,
    });
  },

  logout: () => {
    void removeStorage(TOKEN_KEY);
    void removeStorage(USER_KEY);
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  },
}));
