import {
  buildMissingProfileUpdate,
  extractClerkErrorMessage,
  getGoogleFallbackUser,
  isRateLimitError,
  isSessionExistsError,
  isUserExistsError,
  isUserNotFoundError,
  isValidEmailFormat,
  resolveGoogleSessionId,
} from "../../src/features/auth/utils/auth-helpers";

describe("auth feature validation", () => {
  it("should validate email format properly", () => {
    expect(isValidEmailFormat("test@example.com")).toBe(true);
    expect(isValidEmailFormat("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmailFormat("invalid-email")).toBe(false);
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat("   ")).toBe(false);
    expect(isValidEmailFormat("test@")).toBe(false);
  });

  it("should validate 6-digit OTP code properly", () => {
    const isValidOtp = (code: string) => {
      const clean = code.replace(/\D/g, "").trim();
      return clean.length === 6;
    };

    expect(isValidOtp("123456")).toBe(true);
    expect(isValidOtp(" 123 456 ")).toBe(true);
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("1234567")).toBe(false);
    expect(isValidOtp("abc123456")).toBe(true);
    expect(isValidOtp("abcdef")).toBe(false);
  });

  it("should sanitize OTP inputs to max 6 digits", () => {
    const sanitizeOtp = (input: string, maxLen = 6) =>
      input.replace(/\D/g, "").slice(0, maxLen);

    expect(sanitizeOtp("123456")).toBe("123456");
    expect(sanitizeOtp("12a34b56c78")).toBe("123456");
    expect(sanitizeOtp(" 9 8 7 6 5 4 ")).toBe("987654");
    expect(sanitizeOtp("")).toBe("");
  });

  it("should detect rate limit errors correctly from Clerk responses", () => {
    const clerkRateLimitObj = {
      errors: [
        {
          code: "too_many_requests",
          message: "Too many requests. Please try again in a bit.",
        },
      ],
    };
    expect(isRateLimitError(clerkRateLimitObj)).toBe(true);

    const clerkMessageOnly = {
      errors: [
        {
          message: "Too many requests. Please try again in a bit.",
        },
      ],
    };
    expect(isRateLimitError(clerkMessageOnly)).toBe(true);

    const errorInstance = new Error(
      "Too many requests. Please try again in a bit.",
    );
    expect(isRateLimitError(errorInstance)).toBe(true);

    const normalError = new Error("Invalid password");
    expect(isRateLimitError(normalError)).toBe(false);
    expect(isRateLimitError(null)).toBe(false);
  });

  it("should detect user existence, not found, and session errors correctly", () => {
    expect(
      isUserExistsError({ errors: [{ code: "form_identifier_exists" }] }),
    ).toBe(true);
    expect(
      isUserNotFoundError({ errors: [{ code: "form_identifier_not_found" }] }),
    ).toBe(true);
    expect(isSessionExistsError({ errors: [{ code: "session_exists" }] })).toBe(
      true,
    );
    expect(isSessionExistsError(new Error("already signed in"))).toBe(true);
  });

  it("should extract appropriate Clerk error messages", () => {
    expect(
      extractClerkErrorMessage({
        errors: [{ message: "Custom message" }],
      }),
    ).toBe("Custom message");

    expect(extractClerkErrorMessage(new Error("Plain error"))).toBe(
      "Plain error",
    );

    expect(extractClerkErrorMessage({}, "Fallback message")).toBe(
      "Fallback message",
    );
  });
});

describe("Google SSO helpers", () => {
  it("resolves the session id from the SSO result", () => {
    expect(resolveGoogleSessionId({ createdSessionId: "sess_1" })).toBe(
      "sess_1",
    );
    expect(
      resolveGoogleSessionId({
        createdSessionId: null,
        signIn: { createdSessionId: "sess_2" },
      }),
    ).toBe("sess_2");
    expect(
      resolveGoogleSessionId({
        createdSessionId: null,
        signIn: { createdSessionId: null },
        signUp: { createdSessionId: "sess_3" },
      }),
    ).toBe("sess_3");
    expect(resolveGoogleSessionId({ createdSessionId: null })).toBeNull();
  });

  it("builds a fallback user from the SSO result", () => {
    expect(
      getGoogleFallbackUser({
        signIn: { identifier: "  User@Example.com " },
        signUp: { firstName: "  An " },
      }),
    ).toEqual({ email: "user@example.com", name: "An" });

    expect(
      getGoogleFallbackUser({
        signIn: { identifier: null },
        signUp: { emailAddress: "google@example.com", firstName: null },
      }),
    ).toEqual({ email: "google@example.com", name: "Google User" });

    expect(getGoogleFallbackUser({})).toEqual({
      email: "google.user@clerk.dev",
      name: "Google User",
    });
  });

  it("fills only the profile fields Clerk reports as missing", () => {
    expect(buildMissingProfileUpdate(["username"], "123_abcd")).toEqual({
      username: "user_123_abcd",
    });

    expect(
      buildMissingProfileUpdate(
        ["first_name", "last_name", "username"],
        "123_abcd",
      ),
    ).toEqual({
      username: "user_123_abcd",
      firstName: "Monevo",
      lastName: "User",
    });

    expect(buildMissingProfileUpdate([], "123_abcd")).toEqual({});
  });
});
