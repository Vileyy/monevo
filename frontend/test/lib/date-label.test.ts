import { formatDateLabel } from '@/lib/date-label';

describe('formatDateLabel', () => {
  it('renders weekday, day and month for one full week', () => {
    const week: [Date, string][] = [
      [new Date(2026, 9, 26), 'Mon, 26 Oct'],
      [new Date(2026, 9, 27), 'Tue, 27 Oct'],
      [new Date(2026, 9, 28), 'Wed, 28 Oct'],
      [new Date(2026, 9, 29), 'Thu, 29 Oct'],
      [new Date(2026, 9, 30), 'Fri, 30 Oct'],
      [new Date(2026, 9, 31), 'Sat, 31 Oct'],
      [new Date(2026, 10, 1), 'Sun, 1 Nov'],
    ];

    week.forEach(([date, expected]) => {
      expect(formatDateLabel(date)).toBe(expected);
    });
  });

  it('does not zero-pad single-digit days', () => {
    expect(formatDateLabel(new Date(2026, 0, 1))).toBe('Thu, 1 Jan');
    expect(formatDateLabel(new Date(2026, 3, 5))).toBe('Sun, 5 Apr');
  });

  it('maps every month to its short name', () => {
    const expectedMonths = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    expectedMonths.forEach((month, index) => {
      expect(formatDateLabel(new Date(2026, index, 15))).toContain(
        ` 15 ${month}`,
      );
    });
  });

  it('uses local calendar parts, ignoring the time of day', () => {
    const lateNight = new Date(2026, 9, 26, 23, 59, 59);

    expect(formatDateLabel(lateNight)).toBe('Mon, 26 Oct');
  });

  it('rolls over at month end', () => {
    expect(formatDateLabel(new Date(2026, 9, 31, 23, 59))).toBe('Sat, 31 Oct');
    expect(formatDateLabel(new Date(2026, 10, 1, 0, 0))).toBe('Sun, 1 Nov');
  });
});
