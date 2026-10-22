import { buildCalendarWeeks, formatRangeLabel } from "@/lib/date-range";

describe("date-range utilities", () => {
  describe("buildCalendarWeeks", () => {
    it("should fill leading cells with previous month days", () => {
      const weeks = buildCalendarWeeks(2026, 9); // October 2026
      const firstWeek = weeks[0];

      expect(firstWeek).toHaveLength(7);
      expect(firstWeek[0]).toMatchObject({
        day: 27,
        isAdjacent: true,
      });
      expect(firstWeek[0].date.getMonth()).toBe(8); // September
      expect(firstWeek[4]).toMatchObject({
        day: 1,
        isAdjacent: false,
      });
    });

    it("should contain every day of the month exactly once", () => {
      const weeks = buildCalendarWeeks(2026, 9);
      const currentMonthDays = weeks
        .flat()
        .filter((cell) => !cell.isAdjacent)
        .map((cell) => cell.day);

      expect(currentMonthDays).toHaveLength(31);
      expect(currentMonthDays[0]).toBe(1);
      expect(currentMonthDays[30]).toBe(31);
      expect(weeks.every((week) => week.length === 7)).toBe(true);
    });

    it("should pad trailing cells with next month days", () => {
      const weeks = buildCalendarWeeks(2026, 8); // September 2026
      const lastWeek = weeks[weeks.length - 1];

      expect(lastWeek[lastWeek.length - 1]).toMatchObject({
        day: 3,
        isAdjacent: true,
      });
      expect(lastWeek[lastWeek.length - 1].date.getMonth()).toBe(9); // October
    });
  });

  describe("formatRangeLabel", () => {
    it("should return a placeholder without a start date", () => {
      expect(formatRangeLabel(null, null)).toBe("--");
    });

    it("should collapse to a single date when start equals end", () => {
      expect(formatRangeLabel(new Date(2026, 9, 5), new Date(2026, 9, 5))).toBe(
        "Oct 5, 2026",
      );
    });

    it("should omit the repeated month and year within a month", () => {
      expect(
        formatRangeLabel(new Date(2026, 9, 1), new Date(2026, 9, 31)),
      ).toBe("Oct 1 – 31, 2026");
    });

    it("should show both months within the same year", () => {
      expect(
        formatRangeLabel(new Date(2026, 8, 23), new Date(2026, 9, 22)),
      ).toBe("Sep 23 – Oct 22, 2026");
    });

    it("should show both years when the range crosses a year boundary", () => {
      expect(
        formatRangeLabel(new Date(2026, 11, 20), new Date(2027, 0, 5)),
      ).toBe("Dec 20, 2026 – Jan 5, 2027");
    });
  });
});
