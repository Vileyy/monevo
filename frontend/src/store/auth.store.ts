import { create } from 'zustand';

type AuthState = {
  user: null;
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  setAuthenticated: (value) =>
    set({
      isAuthenticated: value,
    }),
}));