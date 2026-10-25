import { displayableEmail, getInitials } from "@/lib/user-profile";

describe("user-profile utilities", () => {
  describe("displayableEmail", () => {
    it("should return a real email address", () => {
      expect(displayableEmail("hieu@example.com")).toBe("hieu@example.com");
    });

    it("should hide Clerk placeholder emails", () => {
      expect(
        displayableEmail("user_3Irg6b5n0uuAWkOMrBSVg2ON0hE@clerk.user"),
      ).toBeNull();
      expect(displayableEmail("google.user@clerk.dev")).toBeNull();
    });

    it("should hide missing or malformed values", () => {
      expect(displayableEmail(null)).toBeNull();
      expect(displayableEmail(undefined)).toBeNull();
      expect(displayableEmail("not-an-email")).toBeNull();
    });
  });

  describe("getInitials", () => {
    it("should use the first and last name", () => {
      expect(getInitials("Monevo Member", "a@b.com")).toBe("MM");
      expect(getInitials("  Hieu   Nguyen ", null)).toBe("HN");
    });

    it("should use the first two letters of a single name", () => {
      expect(getInitials("Hieu")).toBe("HI");
    });

    it("should fall back to the email", () => {
      expect(getInitials(null, "hieu@example.com")).toBe("HI");
    });

    it("should default to ME", () => {
      expect(getInitials()).toBe("ME");
    });
  });
});
