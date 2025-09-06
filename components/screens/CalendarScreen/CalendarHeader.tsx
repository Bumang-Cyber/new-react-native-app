import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../../../src/constants/theme';

interface CalendarHeaderProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayPress: () => void; // 새로 추가
}

const MONTH_NAMES = [
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

const WEEK_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarHeader = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
  onTodayPress,
}: CalendarHeaderProps) => {
  return (
    <>
      {/* 헤더 */}
      <View style={styles.header}>
        {/* 좌측: 네비게이션 그룹 */}
        <View style={styles.navigationGroup}>
          <TouchableOpacity onPress={onPrevMonth} style={styles.arrowButton}>
            <Text style={styles.arrow}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.monthText}>
            {MONTH_NAMES[currentDate.getMonth()]}, {currentDate.getFullYear()}
          </Text>

          <TouchableOpacity onPress={onNextMonth} style={styles.arrowButton}>
            <Text style={styles.arrow}>▶</Text>
          </TouchableOpacity>
        </View>

        {/* 우측: 오늘 버튼 */}
        <TouchableOpacity onPress={onTodayPress} style={styles.todayButton}>
          <Text style={styles.todayText}>today</Text>
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
  navigationGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  arrow: {
    ...typography.h3,
    color: colors.primary,
  },
  monthText: {
    ...typography.monthTitle,
    color: colors.text.primary,
    marginHorizontal: spacing.md,
    minWidth: 100,
    textAlign: 'center',
  },
  todayButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  todayText: {
    ...typography.captionMedium,
    color: colors.primary,
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
