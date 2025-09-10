// CalendarPage.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';
import CollapsibleCalendarTabs from '../components/screens/CalendarScreen/CollapsibleCalendarTabs';

type Event = { id: string; title: string; time?: string; date: string }; // date: 'YYYY-MM-DD'

// 데모용 일정 데이터
const SAMPLE_EVENTS: Event[] = [
  {
    id: '1',
    title: '디자인 미팅',
    time: '10:00',
    date: dayjs().format('YYYY-MM-DD'),
  },
  {
    id: '2',
    title: 'iOS 배포',
    time: '14:00',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  },
  {
    id: '3',
    title: '런칭 리허설',
    date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
  },
];

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    dayjs().startOf('day'),
  );

  // 선택된 날짜의 이벤트 필터
  const eventsForSelected = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD');
    return SAMPLE_EVENTS.filter(e => e.date === key);
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <CollapsibleCalendarTabs
        selected={selectedDate}
        onSelectDate={setSelectedDate}
        renderDiet={() => (
          <View style={styles.calenderContainer}>
            <View style={styles.workHeader}>
              <Text style={styles.workHeaderText}>일정</Text>
            </View>
            <FlatList
              style={styles.calenderContainer}
              data={eventsForSelected}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.contentContainer}
              renderItem={({ item }) => (
                <View style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  {item.time ? (
                    <Text style={styles.eventTime}>{item.time}</Text>
                  ) : null}
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  선택한 날짜에 일정이 없습니다.
                </Text>
              }
            />
          </View>
        )}
        renderWorkout={() => <Text>운동 탭</Text>}
        renderBody={() => <Text>신체 탭</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
    // marginTop: 60,
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
