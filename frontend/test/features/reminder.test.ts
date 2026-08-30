import { getReminderCategoryMeta, REMINDER_PRESETS } from "@/lib/reminders";

describe("reminders library", () => {
  it("should have all major presets configured", () => {
    const categories = REMINDER_PRESETS.map((p) => p.category);
    expect(categories).toContain("MEDICINE");
    expect(categories).toContain("ELECTRICITY");
    expect(categories).toContain("WATER");
    expect(categories).toContain("RENT");
    expect(categories).toContain("INTERNET");
    expect(categories).toContain("PHONE");
  });

  it("should return correct metadata for MEDICINE", () => {
    const meta = getReminderCategoryMeta("MEDICINE");
    expect(meta.label).toBe("Tiền thuốc");
    expect(meta.icon).toBe("medkit");
  });

  it("should fallback to OTHER for unknown categories", () => {
    const meta = getReminderCategoryMeta("UNKNOWN");
    expect(meta.category).toBe("OTHER");
  });
});
