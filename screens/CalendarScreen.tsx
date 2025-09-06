import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarHeader from '../components/screens/CalendarScreen/CalendarHeader';
import CalendarGrid from '../components/screens/CalendarScreen/CalendarGrid';

const CalendarScreen = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const changeMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onTodayPress={handleGoToToday}
        />

        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDatePress={handleDatePress}
          onSwipeLeft={() => changeMonth(1)} // 다음 달
          onSwipeRight={() => changeMonth(-1)} // 이전 달
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
});

export default CalendarScreen;
