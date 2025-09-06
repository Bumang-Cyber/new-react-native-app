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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <CalendarHeader
          currentDate={currentDate}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
        />

        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDatePress={handleDatePress}
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
