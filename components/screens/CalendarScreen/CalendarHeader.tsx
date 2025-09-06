import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  onPrevMonth,
  onNextMonth,
}) => {
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
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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
    marginBottom: 20,
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    paddingHorizontal: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});

export default CalendarHeader;
