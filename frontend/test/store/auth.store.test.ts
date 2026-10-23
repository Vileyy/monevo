import { useAuthStore } from "@/store/auth.store";

describe("auth.store", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: true,
    });
  });

  it("should handle login", () => {
    const mockUser = { id: "1", email: "user@test.com", name: "User" };
    useAuthStore.getState().login(mockUser, "test-token");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
    expect(state.token).toBe("test-token");
  });

  it("should handle updateUser", () => {
    const mockUser = { id: "1", email: "user@test.com", name: "User" };
    useAuthStore.getState().login(mockUser, "test-token");

    useAuthStore.getState().updateUser({ name: "Updated User" });

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe("Updated User");
    expect(state.user?.email).toBe("user@test.com");
  });

  it("should handle login with avatarUrl", () => {
    const mockUser = {
      id: "1",
      email: "user@test.com",
      name: "Google User",
      avatarUrl: "https://lh3.googleusercontent.com/avatar.jpg",
    };
    useAuthStore.getState().login(mockUser, "test-token");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.avatarUrl).toBe("https://lh3.googleusercontent.com/avatar.jpg");
  });

  it("should handle updateUser with avatarUrl and name", () => {
    const mockUser = { id: "1", email: "user@test.com", name: "User" };
    useAuthStore.getState().login(mockUser, "test-token");

    useAuthStore.getState().updateUser({
      name: "Doan Quoc Hieu",
      avatarUrl: "https://lh3.googleusercontent.com/photo.png",
    });

    const state = useAuthStore.getState();
    expect(state.user?.name).toBe("Doan Quoc Hieu");
    expect(state.user?.avatarUrl).toBe("https://lh3.googleusercontent.com/photo.png");
  });

  it("should handle logout without throwing", () => {
    const mockUser = { id: "1", email: "user@test.com", name: "User" };
    useAuthStore.getState().login(mockUser, "test-token");

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
