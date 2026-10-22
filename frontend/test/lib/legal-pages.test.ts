import { legalPageUrl } from "@/lib/legal-pages";

describe("legalPageUrl", () => {
  it("builds URLs from the API base", () => {
    expect(legalPageUrl("privacy", "https://api.monevo.app")).toBe(
      "https://api.monevo.app/legal/privacy",
    );
    expect(legalPageUrl("terms", "https://api.monevo.app/")).toBe(
      "https://api.monevo.app/legal/terms",
    );
    expect(
      legalPageUrl("account-deletion", "https://api.monevo.app///"),
    ).toBe("https://api.monevo.app/legal/account-deletion");
  });

  it("returns null when the API base is missing", () => {
    expect(legalPageUrl("privacy", undefined)).toBeNull();
    expect(legalPageUrl("privacy", "")).toBeNull();
    expect(legalPageUrl("privacy", "   ")).toBeNull();
  });
});
