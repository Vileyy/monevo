import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { BiometricIconName } from "@/lib/biometric-label";
import {
  authenticateWithBiometrics,
  getBiometricCapability,
  getBiometricSession,
  isBiometricEnabled,
  isBiometricEnrolled,
  saveBiometricSession,
  setBiometricEnabled,
} from "@/lib/biometrics";

export type User = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
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

export type BiometricEnableResult = "success" | "cancelled" | "unavailable";

export type BiometricLoginResult =
  "success" | "cancelled" | "no-session" | "unavailable";

type StoredSession = {
  user: User;
  token: string;
};

async function readStoredSession(): Promise<StoredSession | null> {
  const [savedToken, savedUserJson] = await Promise.all([
    getStorage(TOKEN_KEY),
    getStorage(USER_KEY),
  ]);

  if (!savedToken || !savedUserJson) return null;

  return {
    token: savedToken,
    user: JSON.parse(savedUserJson) as User,
  };
}

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
  biometricLabel: string;
  biometricIcon: BiometricIconName;
  restoreSession: () => Promise<void>;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshBiometricState: () => Promise<void>;
  enableBiometrics: () => Promise<BiometricEnableResult>;
  disableBiometrics: () => Promise<void>;
  loginWithBiometrics: () => Promise<BiometricLoginResult>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrated: false,
  biometricEnabled: false,
  biometricAvailable: false,
  biometricLabel: "Biometrics",
  biometricIcon: "lock-closed-outline",

  restoreSession: async () => {
    try {
      const [session, biometricEnabled] = await Promise.all([
        readStoredSession(),
        isBiometricEnabled(),
      ]);

      if (session) {
        if (biometricEnabled) {
          const capability = await getBiometricCapability();

          if (!capability.available) {
            set({
              isHydrated: true,
              biometricEnabled: false,
              biometricAvailable: false,
              biometricLabel: capability.label,
              biometricIcon: capability.icon,
            });
            return;
          }

          const unlocked = await authenticateWithBiometrics("Unlock Monevo");
          if (!unlocked) {
            set({
              isHydrated: true,
              biometricEnabled: true,
              biometricAvailable: true,
              biometricLabel: capability.label,
              biometricIcon: capability.icon,
            });
            return;
          }

          set({
            user: session.user,
            token: session.token,
            isAuthenticated: true,
            isHydrated: true,
            biometricEnabled: true,
            biometricAvailable: true,
            biometricLabel: capability.label,
            biometricIcon: capability.icon,
          });
          return;
        }

        set({
          user: session.user,
          token: session.token,
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

    void (async () => {
      try {
        const enrolled = await isBiometricEnrolled();
        if (enrolled) {
          await saveBiometricSession(user, token);
          await setBiometricEnabled(true);
          const capability = await getBiometricCapability();
          set({
            biometricEnabled: true,
            biometricAvailable: capability.available,
            biometricLabel: capability.label,
            biometricIcon: capability.icon,
          });
        }
      } catch {}
    })();
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

  updateUser: (partialUser) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partialUser };
    void saveStorage(USER_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  refreshBiometricState: async () => {
    const [capability, enabled, biometricSession] = await Promise.all([
      getBiometricCapability(),
      isBiometricEnabled(),
      getBiometricSession(),
    ]);
    const isReady = (enabled || !!biometricSession) && capability.available;
    set({
      biometricEnabled: isReady,
      biometricAvailable: capability.available,
      biometricLabel: capability.label,
      biometricIcon: capability.icon,
    });
  },

  enableBiometrics: async () => {
    const capability = await getBiometricCapability();
    if (!capability.available) {
      set({
        biometricAvailable: false,
        biometricLabel: capability.label,
        biometricIcon: capability.icon,
      });
      return "unavailable";
    }

    const confirmed = await authenticateWithBiometrics(
      `Enable ${capability.label} for Monevo`,
    );
    if (!confirmed) return "cancelled";

    const current = get();
    if (current.user && current.token) {
      await saveBiometricSession(current.user, current.token);
    }
    await setBiometricEnabled(true);
    set({
      biometricEnabled: true,
      biometricAvailable: true,
      biometricLabel: capability.label,
      biometricIcon: capability.icon,
    });
    return "success";
  },

  disableBiometrics: async () => {
    await setBiometricEnabled(false);
    set({ biometricEnabled: false });
  },

  loginWithBiometrics: async () => {
    const capability = await getBiometricCapability();
    if (!capability.available) return "unavailable";

    const enrolled = await isBiometricEnrolled();
    if (!enrolled) return "unavailable";

    const authenticated = await authenticateWithBiometrics(
      `Sign in to Monevo with ${capability.label}`,
    );
    if (!authenticated) return "cancelled";

    try {
      let session = await readStoredSession();
      if (!session) {
        session = await getBiometricSession();
      }
      if (!session) return "no-session";

      void saveStorage(TOKEN_KEY, session.token);
      void saveStorage(USER_KEY, JSON.stringify(session.user));

      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isHydrated: true,
        biometricEnabled: true,
        biometricAvailable: true,
        biometricLabel: capability.label,
        biometricIcon: capability.icon,
      });
      return "success";
    } catch {
      return "no-session";
    }
  },
}));
