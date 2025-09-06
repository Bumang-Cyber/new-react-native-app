import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { isSameDay, isToday, isCurrentMonth } from '../../../utils/dateUtils';
import { colors, typography, spacing } from '../../../src/constants/theme';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
}

const CalendarGrid = ({
  currentDate,
  selectedDate,
  onDatePress,
}: CalendarGridProps) => {
  // 해당 월의 날짜 세팅
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    // 해당 월의 첫일
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    // 화면상의 첫 번째 row의 시작일 (일요일)을 찾기
    // 0부터 음수가 될 시 '이전 달 여분의 날짜'가 됨
    startDate.setDate(1 - firstDay.getDay());

    const days = [];
    // 6주 * 7일 고정 (구글캘린더 방식)
    for (let i = 0; i < 42; i++) {
      const day = new Date(year, month, 1 + i - firstDay.getDay());
      days.push(day);
    }
    return days;
  };

  const days = getDaysInMonth(currentDate);

  const weeks = [];
  for (let i = 0; i < 6; i++) {
    weeks.push(days.slice(i * 7, (i + 1) * 7));
  }

  return (
    <View style={styles.calendarGrid}>
      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const isCurrentMonthDate = isCurrentMonth(day, currentDate);

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
  calendarGrid: {
    // 기본 컨테이너 스타일
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
    fontWeight: 600,
  },
  todayDay: {
    backgroundColor: colors.calendar.today,
  },
  todayText: {
    color: colors.calendar.todayText,
    fontWeight: 600,
  },
});

export default CalendarGrid;
