import { DEFAULT_LEGAL_BASE_URL, legalPageUrl } from "@/lib/legal-pages";

describe("legalPageUrl", () => {
  it("builds URLs from the provided base", () => {
    expect(legalPageUrl("privacy", "https://api.monevo.app")).toBe(
      "https://api.monevo.app/legal/privacy",
    );
    expect(legalPageUrl("terms", "https://api.monevo.app/")).toBe(
      "https://api.monevo.app/legal/terms",
    );
    expect(legalPageUrl("account-deletion", "https://api.monevo.app///")).toBe(
      "https://api.monevo.app/legal/account-deletion",
    );
  });

  it("falls back to the public legal site", () => {
    expect(legalPageUrl("privacy")).toBe(
      `${DEFAULT_LEGAL_BASE_URL}/legal/privacy`,
    );
    expect(legalPageUrl("privacy", undefined)).toBe(
      `${DEFAULT_LEGAL_BASE_URL}/legal/privacy`,
    );
    expect(DEFAULT_LEGAL_BASE_URL.startsWith("https://")).toBe(true);
  });

  it("returns null when the base is explicitly blank", () => {
    expect(legalPageUrl("privacy", "")).toBeNull();
    expect(legalPageUrl("privacy", "   ")).toBeNull();
    expect(legalPageUrl("privacy", null)).toBeNull();
  });
});
