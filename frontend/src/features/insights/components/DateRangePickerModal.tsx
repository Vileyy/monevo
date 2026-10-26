import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@/theme';
import { Button, Modal } from '@/components/ui';
import { buildCalendarWeeks, formatRangeLabel } from '@/lib/date-range';
import type { CalendarCell } from '@/lib/date-range';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DateRangePickerModalProps {
  visible: boolean;
  onClose: () => void;
  initialRange: DateRange;
  onApplyRange: (range: DateRange) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const MAX_CELL_SIZE = 46;
const MAX_CONTENT_WIDTH = 640;
// Modal body padding (spacing.xl each side) + calendar card padding
const CHROME_WIDTH = spacing.xl * 2 + spacing.base * 2;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(d1: Date | null, d2: Date | null) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isBetweenDays(day: Date, start: Date | null, end: Date | null) {
  if (!start || !end) return false;
  const t = startOfDay(day).getTime();
  return t > startOfDay(start).getTime() && t < startOfDay(end).getTime();
}

export function DateRangePickerModal({
  visible,
  onClose,
  initialRange,
  onApplyRange,
}: DateRangePickerModalProps) {
  return (
    <Modal visible={visible} onClose={onClose} title="Filter Date Range">
      {visible && (
        <DateRangePickerContent
          initialRange={initialRange}
          onApplyRange={onApplyRange}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

// Mounted only while the sheet is open, so state always starts from the
// currently applied range without re-sync effects.
function DateRangePickerContent({
  onClose,
  initialRange,
  onApplyRange,
}: Omit<DateRangePickerModalProps, 'visible'>) {
  const { width: windowWidth } = useWindowDimensions();

  const [viewYear, setViewYear] = useState<number>(() =>
    initialRange.startDate.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    initialRange.startDate.getMonth(),
  );

  const [selectedStart, setSelectedStart] = useState<Date | null>(() =>
    startOfDay(initialRange.startDate),
  );

  const [selectedEnd, setSelectedEnd] = useState<Date | null>(() =>
    startOfDay(initialRange.endDate),
  );

  const cellSize = Math.max(
    34,
    Math.min(
      MAX_CELL_SIZE,
      Math.floor((Math.min(windowWidth, MAX_CONTENT_WIDTH) - CHROME_WIDTH) / 7),
    ),
  );
  const circleSize = Math.min(38, cellSize - 4);
  const gridWidth = cellSize * 7;

  const calendarWeeks = useMemo(
    () => buildCalendarWeeks(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const goToMonth = (offset: number) => {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const applyPreset = (
    preset: 'THIS_MONTH' | 'FIRST_15' | 'LAST_15' | 'LAST_7' | 'LAST_30',
  ) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    let start: Date;
    let end: Date;

    switch (preset) {
      case 'THIS_MONTH':
        start = new Date(year, month, 1);
        end = new Date(year, month, lastDay);
        break;
      case 'FIRST_15':
        start = new Date(year, month, 1);
        end = new Date(year, month, 15);
        break;
      case 'LAST_15':
        start = new Date(year, month, 16);
        end = new Date(year, month, lastDay);
        break;
      case 'LAST_7':
        start = new Date(year, month, now.getDate() - 6);
        end = new Date(year, month, now.getDate());
        break;
      case 'LAST_30':
        start = new Date(year, month, now.getDate() - 29);
        end = new Date(year, month, now.getDate());
        break;
    }

    setViewYear(start.getFullYear());
    setViewMonth(start.getMonth());
    setSelectedStart(start);
    setSelectedEnd(end);
  };

  const handleDateSelect = (cell: CalendarCell) => {
    const tapped = cell.date;

    // Jump to the tapped month when the user picks an adjacent-month day
    if (cell.isAdjacent) {
      setViewYear(tapped.getFullYear());
      setViewMonth(tapped.getMonth());
    }

    if (!selectedStart || selectedEnd) {
      setSelectedStart(tapped);
      setSelectedEnd(null);
      return;
    }

    if (tapped.getTime() < selectedStart.getTime()) {
      setSelectedStart(tapped);
      setSelectedEnd(selectedStart);
    } else {
      setSelectedEnd(tapped);
    }
  };

  const handleApply = () => {
    if (!selectedStart) {
      Alert.alert('Selection Required', 'Please select a date range.');
      return;
    }

    const start = new Date(
      selectedStart.getFullYear(),
      selectedStart.getMonth(),
      selectedStart.getDate(),
      0,
      0,
      0,
      0,
    );

    const effectiveEnd = selectedEnd || selectedStart;
    const end = new Date(
      effectiveEnd.getFullYear(),
      effectiveEnd.getMonth(),
      effectiveEnd.getDate(),
      23,
      59,
      59,
      999,
    );

    onApplyRange({ startDate: start, endDate: end });
    onClose();
  };

  const rangeDaysCount = useMemo(() => {
    if (!selectedStart) return 0;
    const end = selectedEnd || selectedStart;
    const diff =
      Math.round(
        (end.getTime() - selectedStart.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;
    return Math.max(1, diff);
  }, [selectedStart, selectedEnd]);

  const today = startOfDay(new Date());

  return (
    <View style={styles.container}>
      {/* Quick presets */}
      <View style={styles.presetGroup}>
        <View style={styles.presetRow}>
          <PresetChip
            label="This Month"
            onPress={() => applyPreset('THIS_MONTH')}
          />
          <PresetChip
            label="1st – 15th"
            onPress={() => applyPreset('FIRST_15')}
          />
          <PresetChip
            label="16th – End"
            onPress={() => applyPreset('LAST_15')}
          />
        </View>
        <View style={styles.presetRow}>
          <PresetChip
            label="Last 7 Days"
            onPress={() => applyPreset('LAST_7')}
          />
          <PresetChip
            label="Last 30 Days"
            onPress={() => applyPreset('LAST_30')}
          />
        </View>
      </View>

      {/* Calendar */}
      <View style={styles.calendarCard}>
        <View style={styles.headerRow}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>

          <View style={styles.navGroup}>
            <Pressable
              onPress={() => goToMonth(-1)}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Previous month"
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={() => goToMonth(1)}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.navButtonPressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Next month"
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>

        <View style={[styles.weekdaysRow, { width: gridWidth }]}>
          {WEEKDAY_HEADERS.map((weekday) => (
            <Text
              key={weekday}
              style={[styles.weekdayLabel, { width: cellSize }]}
            >
              {weekday}
            </Text>
          ))}
        </View>

        <View style={{ width: gridWidth }}>
          {calendarWeeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((cell, cellIndex) => {
                const isStart = isSameDay(cell.date, selectedStart);
                const isEnd = isSameDay(cell.date, selectedEnd);
                const isSingle = isStart && isEnd;
                const isSelected = isStart || isEnd;
                const inRange = isBetweenDays(
                  cell.date,
                  selectedStart,
                  selectedEnd,
                );
                const showBand =
                  inRange ||
                  (isStart && !!selectedEnd && !isSingle) ||
                  (isEnd && !!selectedStart && !isSingle);
                const isBandStart = isStart && !!selectedEnd && !isSingle;
                const isBandEnd = isEnd && !!selectedStart && !isSingle;
                const isToday = isSameDay(cell.date, today);

                return (
                  <View
                    key={cellIndex}
                    style={[
                      styles.dayCell,
                      { width: cellSize, height: cellSize },
                    ]}
                  >
                    {showBand && (
                      <View
                        style={[
                          styles.rangeBand,
                          { height: cellSize },
                          isBandStart && {
                            left: '50%',
                            borderTopLeftRadius: cellSize / 2,
                            borderBottomLeftRadius: cellSize / 2,
                          },
                          isBandEnd && {
                            right: '50%',
                            borderTopRightRadius: cellSize / 2,
                            borderBottomRightRadius: cellSize / 2,
                          },
                        ]}
                      />
                    )}

                    <Pressable
                      onPress={() => handleDateSelect(cell)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        {
                          width: circleSize,
                          height: circleSize,
                          borderRadius: circleSize / 2,
                        },
                        isSelected && styles.dayButtonSelected,
                        pressed && !isSelected && styles.dayButtonPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${cell.day} ${MONTH_NAMES[cell.date.getMonth()]} ${cell.date.getFullYear()}`}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          cell.isAdjacent && styles.dayTextAdjacent,
                          inRange && styles.dayTextInRange,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {cell.day}
                      </Text>
                      {isToday && !isSelected && (
                        <View style={styles.todayDot} />
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Selection summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconBox}>
          <Ionicons
            name="calendar-outline"
            size={18}
            color={colors.primaryDark}
          />
        </View>

        <View style={styles.summaryTextCol}>
          <Text style={styles.summaryLabel}>SELECTED RANGE</Text>
          <Text style={styles.summaryDates} numberOfLines={2}>
            {formatRangeLabel(selectedStart, selectedEnd)}
          </Text>
        </View>

        <View style={styles.daysPill}>
          <Text style={styles.daysPillText}>
            {rangeDaysCount} {rangeDaysCount === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onClose}
          style={styles.button}
        />
        <Button
          title="Apply Range"
          onPress={handleApply}
          style={styles.button}
        />
      </View>
    </View>
  );
}

function PresetChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.presetChip,
        pressed && styles.presetChipPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.presetText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  presetGroup: {
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetChipPressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  presetText: {
    ...typography.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: spacing.md,
  },
  monthTitle: {
    ...typography.title3,
    color: colors.text,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  navButtonPressed: {
    backgroundColor: colors.border,
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.primaryLight,
  },
  dayButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayButtonPressed: {
    backgroundColor: colors.primaryMuted,
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '500',
    color: colors.text,
    ...typography.tabular,
  },
  dayTextAdjacent: {
    color: colors.textMuted,
    opacity: 0.45,
  },
  dayTextInRange: {
    color: colors.primaryDark,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: '700',
    opacity: 1,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  summaryTextCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  summaryDates: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: 2,
    flexShrink: 1,
  },
  daysPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
  },
  daysPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
