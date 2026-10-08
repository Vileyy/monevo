describe("auth feature validation", () => {
  it("should validate email format properly", () => {
    const isValidEmail = (email: string) =>
      Boolean(email.trim()) && /\S+@\S+\.\S+/.test(email.trim());

    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("   ")).toBe(false);
    expect(isValidEmail("test@")).toBe(false);
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
});
