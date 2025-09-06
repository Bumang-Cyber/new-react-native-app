import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../src/constants/theme';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
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

const WEEK_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarHeader = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: CalendarHeaderProps) => {
  return (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        {/* 전월 */}
        <TouchableOpacity onPress={onPrevMonth}>
          <Text style={styles.arrow}>◀</Text>
        </TouchableOpacity>

        {/* 현재 월/주 */}
        <Text style={styles.monthText}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>

        {/* 익월 */}
        <TouchableOpacity onPress={onNextMonth}>
          <Text style={styles.arrow}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekHeader}>
        {WEEK_NAMES.map(day => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  arrow: {
    ...typography.h3,
    color: colors.primary,
    paddingHorizontal: spacing.lg,
  },
  monthText: {
    ...typography.monthTitle,
    color: colors.text.primary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: colors.calendar.weekHeader,
    ...typography.weekDay,
  },
});
export default CalendarHeader;
