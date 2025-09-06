// components/Calendar/MonthCalendar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { isSameDay, isToday, isCurrentMonth } from '../../utils/dateUtils';
import { colors, typography, spacing } from '../../src/constants/theme';

interface MonthCalendarProps {
  days: Date[];
  referenceDate: Date;
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({
  days,
  referenceDate,
  selectedDate,
  onDatePress,
}) => {
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  return (
    <View style={[styles.calendarContainer]}>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day, referenceDate);

            return (
              <TouchableOpacity
                key={dayIndex}
                style={[
                  styles.dayContainer,
                  isTodayDate && styles.todayDay,
                  isSelected && styles.selectedDay,
                ]}
                onPress={() => onDatePress(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonthDate && styles.otherMonthText,
                    isTodayDate && styles.todayText,
                    isSelected && styles.selectedDayText,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    opacity: 1,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayContainer: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: spacing.lg,
    margin: 1,
  },
  dayText: {
    ...typography.dayNumber,
    color: colors.text.primary,
  },
  otherMonthText: {
    color: colors.calendar.otherMonth,
  },
  selectedDay: {
    backgroundColor: colors.calendar.selected,
  },
  selectedDayText: {
    color: colors.background,
    fontWeight: '600' as const,
  },
  todayDay: {
    backgroundColor: colors.calendar.today,
  },
  todayText: {
    color: colors.calendar.todayText,
    fontWeight: '600' as const,
  },
});

export default MonthCalendar;
