import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";
import { Button, Modal } from "@/components/ui";

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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

export function DateRangePickerModal({
  visible,
  onClose,
  initialRange,
  onApplyRange,
}: DateRangePickerModalProps) {
  const [viewYear, setViewYear] = useState<number>(() =>
    initialRange.startDate.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    initialRange.startDate.getMonth(),
  );

  const [selectedStart, setSelectedStart] = useState<Date | null>(() => {
    return new Date(
      initialRange.startDate.getFullYear(),
      initialRange.startDate.getMonth(),
      initialRange.startDate.getDate(),
    );
  });

  const [selectedEnd, setSelectedEnd] = useState<Date | null>(() => {
    return new Date(
      initialRange.endDate.getFullYear(),
      initialRange.endDate.getMonth(),
      initialRange.endDate.getDate(),
    );
  });

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const applyPreset = (
    preset: "THIS_MONTH" | "FIRST_15" | "LAST_15" | "LAST_7" | "LAST_30",
  ) => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    setViewYear(curYear);
    setViewMonth(curMonth);

    if (preset === "THIS_MONTH") {
      const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
      setSelectedStart(new Date(curYear, curMonth, 1));
      setSelectedEnd(new Date(curYear, curMonth, lastDay));
    } else if (preset === "FIRST_15") {
      setSelectedStart(new Date(curYear, curMonth, 1));
      setSelectedEnd(new Date(curYear, curMonth, 15));
    } else if (preset === "LAST_15") {
      const lastDay = new Date(curYear, curMonth + 1, 0).getDate();
      setSelectedStart(new Date(curYear, curMonth, 16));
      setSelectedEnd(new Date(curYear, curMonth, lastDay));
    } else if (preset === "LAST_7") {
      const start = new Date(curYear, curMonth, now.getDate() - 6);
      setSelectedStart(start);
      setSelectedEnd(new Date(curYear, curMonth, now.getDate()));
    } else if (preset === "LAST_30") {
      const start = new Date(curYear, curMonth, now.getDate() - 29);
      setSelectedStart(start);
      setSelectedEnd(new Date(curYear, curMonth, now.getDate()));
    }
  };

  const handleDateSelect = (tappedDate: Date) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(tappedDate);
      setSelectedEnd(null);
    } else if (selectedStart && !selectedEnd) {
      if (tappedDate.getTime() < selectedStart.getTime()) {
        setSelectedStart(tappedDate);
        setSelectedEnd(null);
      } else {
        setSelectedEnd(tappedDate);
      }
    }
  };

  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isBetweenDays = (
    dayDate: Date,
    start: Date | null,
    end: Date | null,
  ) => {
    if (!start || !end) return false;
    const t = dayDate.getTime();
    const s = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
    ).getTime();
    const e = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
    ).getTime();
    return t > s && t < e;
  };

  // Google Calendar style matrix: Sunday to Saturday with adjacent month days
  const calendarWeeks = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      isAdjacent: boolean;
      date: Date;
    }[] = [];

    // Trailing previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(viewYear, viewMonth - 1, day);
      cells.push({ day, isAdjacent: true, date });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({ day: d, isAdjacent: false, date });
    }

    // Leading next month days to complete 5 or 6 rows of 7
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      cells.push({ day: d, isAdjacent: true, date });
    }

    const weeks: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return weeks;
  }, [viewYear, viewMonth]);

  const handleApply = () => {
    if (!selectedStart) {
      Alert.alert("Selection Required", "Please select a date range.");
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

  const formatDateDisplay = (d: Date | null) => {
    if (!d) return "--/--";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
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

  return (
    <Modal visible={visible} onClose={onClose} title="Filter Date Range">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* Quick Presets */}
        <View style={styles.presetsGrid}>
          <Pressable
            style={styles.presetChip}
            onPress={() => applyPreset("THIS_MONTH")}
          >
            <Text style={styles.presetText}>This Month</Text>
          </Pressable>
          <Pressable
            style={styles.presetChip}
            onPress={() => applyPreset("FIRST_15")}
          >
            <Text style={styles.presetText}>1st – 15th</Text>
          </Pressable>
          <Pressable
            style={styles.presetChip}
            onPress={() => applyPreset("LAST_15")}
          >
            <Text style={styles.presetText}>16th – End</Text>
          </Pressable>
          <Pressable
            style={styles.presetChip}
            onPress={() => applyPreset("LAST_7")}
          >
            <Text style={styles.presetText}>Last 7 Days</Text>
          </Pressable>
          <Pressable
            style={styles.presetChip}
            onPress={() => applyPreset("LAST_30")}
          >
            <Text style={styles.presetText}>Last 30 Days</Text>
          </Pressable>
        </View>

        {/* Google Calendar Style Container */}
        <View style={styles.googleCalendarContainer}>
          {/* Header Row: Month Title on Left, Chevrons on Right */}
          <View style={styles.headerRow}>
            <Text style={styles.monthHeaderTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>

            <View style={styles.arrowsGroup}>
              <Pressable
                onPress={handlePrevMonth}
                style={styles.chevronBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Previous month"
              >
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
              <Pressable
                onPress={handleNextMonth}
                style={styles.chevronBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Next month"
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.text}
                />
              </Pressable>
            </View>
          </View>

          {/* Weekday Row (S M T W T F S) */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_HEADERS.map((w, idx) => (
              <Text key={idx} style={styles.weekdayLabel}>
                {w}
              </Text>
            ))}
          </View>

          {/* Weeks Grid */}
          <View style={styles.gridContainer}>
            {calendarWeeks.map((week, wIdx) => (
              <View key={wIdx} style={styles.weekRow}>
                {week.map((cell, cIdx) => {
                  const isStart = isSameDay(cell.date, selectedStart);
                  const isEnd = isSameDay(cell.date, selectedEnd);
                  const inRange = isBetweenDays(
                    cell.date,
                    selectedStart,
                    selectedEnd,
                  );
                  const isSingleSelected =
                    (isStart && !selectedEnd) ||
                    (isStart && isSameDay(selectedStart, selectedEnd));

                  return (
                    <View key={cIdx} style={styles.dayCellContainer}>
                      {/* Range continuous ribbon */}
                      {inRange && (
                        <View
                          style={[
                            styles.ribbonMiddle,
                            cIdx === 0 && styles.ribbonCapLeft,
                            cIdx === 6 && styles.ribbonCapRight,
                          ]}
                        />
                      )}
                      {isStart &&
                        selectedEnd &&
                        !isSameDay(selectedStart, selectedEnd) && (
                          <View
                            style={[
                              styles.ribbonStart,
                              cIdx === 6 && styles.ribbonCapRight,
                            ]}
                          />
                        )}
                      {isEnd &&
                        selectedStart &&
                        !isSameDay(selectedStart, selectedEnd) && (
                          <View
                            style={[
                              styles.ribbonEnd,
                              cIdx === 0 && styles.ribbonCapLeft,
                            ]}
                          />
                        )}

                      {/* Day Circle Button */}
                      <Pressable
                        onPress={() => handleDateSelect(cell.date)}
                        style={[
                          styles.dayCircle,
                          (isStart || isEnd) && styles.dayCircleSelected,
                          isSingleSelected && styles.dayCircleSingle,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${cell.day} ${MONTH_NAMES[cell.date.getMonth()]}`}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            cell.isAdjacent && styles.dayTextAdjacent,
                            (isStart || isEnd) && styles.dayTextSelected,
                            inRange && styles.dayTextInRange,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Selected Range Summary Bar */}
        <View style={styles.selectionSummaryCard}>
          <View style={styles.summaryIconBox}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={colors.primary}
            />
          </View>
          <View style={styles.summaryTextCol}>
            <Text style={styles.summaryLabel}>Selected Range</Text>
            <Text style={styles.summaryDates}>
              {formatDateDisplay(selectedStart)} –{" "}
              {formatDateDisplay(selectedEnd || selectedStart)}
              <Text style={styles.summaryDaysBadge}>
                {" "}
                ({rangeDaysCount} days)
              </Text>
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
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
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  presetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  presetChip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    ...typography.caption,
    fontWeight: "600",
    color: colors.text,
  },
  googleCalendarContainer: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
  },
  monthHeaderTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.3,
  },
  arrowsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
  },
  weekdaysRow: {
    flexDirection: "row",
    width: "100%",
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  gridContainer: {
    paddingTop: 2,
  },
  weekRow: {
    flexDirection: "row",
    width: "100%",
    marginVertical: 2,
  },
  dayCellContainer: {
    flex: 1,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  ribbonMiddle: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: colors.primaryLight,
    zIndex: 0,
  },
  ribbonStart: {
    position: "absolute",
    left: "50%",
    right: 0,
    top: 2,
    bottom: 2,
    backgroundColor: colors.primaryLight,
    zIndex: 0,
  },
  ribbonEnd: {
    position: "absolute",
    left: 0,
    right: "50%",
    top: 2,
    bottom: 2,
    backgroundColor: colors.primaryLight,
    zIndex: 0,
  },
  ribbonCapLeft: {
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  ribbonCapRight: {
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayCircleSingle: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.text,
  },
  dayTextAdjacent: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dayTextSelected: {
    color: colors.surface,
    fontWeight: "700",
  },
  dayTextInRange: {
    color: colors.primaryDark,
    fontWeight: "700",
  },
  selectionSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  summaryDates: {
    ...typography.headline,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  summaryDaysBadge: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
