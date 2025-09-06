import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { isSameDay, isToday, isCurrentMonth } from '../../../utils/dateUtils';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  onDatePress,
}) => {
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    // 첫 주의 시작일 (일요일)을 찾기
    startDate.setDate(1 - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      // 6주 * 7일
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
                  isSelected && styles.selectedDay,
                  isTodayDate && styles.todayDay,
                ]}
                onPress={() => onDatePress(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonthDate && styles.otherMonthText,
                    isSelected && styles.selectedDayText,
                    isTodayDate && styles.todayText,
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
    borderRadius: 20,
    margin: 1,
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  otherMonthText: {
    color: '#ccc',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '600',
  },
  todayDay: {
    backgroundColor: '#007AFF',
  },
  todayText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CalendarGrid;
