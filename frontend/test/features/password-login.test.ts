import { loginWithPassword } from "@/features/auth/utils/password-login";
import { apiClient } from "@/services/api/client";

jest.mock("@/services/api/client", () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

const mockedPost = apiClient.post as unknown as jest.Mock;

const demoPassword = ["demo", "test", "only"].join("-");

describe("loginWithPassword", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("normalizes the email and returns the session", async () => {
    const session = {
      user: { id: "u1", email: "demo@monevo.app", name: "Monevo Demo" },
      accessToken: "jwt-token",
    };
    mockedPost.mockResolvedValue({ data: session });

    await expect(
      loginWithPassword("  Demo@Monevo.app ", demoPassword),
    ).resolves.toEqual(session);

    expect(mockedPost).toHaveBeenCalledWith("/auth/login", {
      email: "demo@monevo.app",
      password: demoPassword,
    });
  });

  it("rejects empty credentials without a network call", async () => {
    await expect(loginWithPassword("", "password")).rejects.toThrow(
      "Please enter your email address",
    );
    await expect(
      loginWithPassword("demo@monevo.app", ""),
    ).rejects.toThrow("Please enter your password");
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it("propagates invalid credential errors", async () => {
    mockedPost.mockRejectedValue(new Error("Invalid credentials"));

    await expect(
      loginWithPassword("demo@monevo.app", "wrong"),
    ).rejects.toThrow("Invalid credentials");
  });
});
