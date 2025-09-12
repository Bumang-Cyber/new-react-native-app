// CalendarPage.tsx
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import CollapsibleCalendarTabs from '@/components/screens/CalendarScreen/CollapsibleCalendarTabs';
import DietTab from '@/components/screens/CalendarScreen/Tabs/DietTab';
import WorkoutTab from '@/components/screens/CalendarScreen/Tabs/WorkoutTab';
import BodyTab from '@/components/screens/CalendarScreen/Tabs/BodyTab';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    dayjs().startOf('day'),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CollapsibleCalendarTabs
        selected={selectedDate}
        onSelectDate={setSelectedDate}
        renderDiet={() => <DietTab />}
        renderWorkout={() => <WorkoutTab />}
        renderBody={() => <BodyTab />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calenderContainer: {
    flex: 1,
  },
  workHeader: {
    height: 40,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  workHeaderText: {
    fontSize: 16,
    fontWeight: 700,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
  },
  selectedText: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  listHeaderText: {
    fontSize: 16,
    fontWeight: '700',
  },
  eventCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  eventTime: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 12,
  },
});
