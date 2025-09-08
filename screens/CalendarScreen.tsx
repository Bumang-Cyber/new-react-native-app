// CalendarPage.tsx
import React, { useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import SwipeCalendarInfinite from '../components/screens/CalendarScreen/SwipeCalendarInfinite'; // 경로에 맞게 수정
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    dayjs().startOf('month'),
  );
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    dayjs().startOf('day'),
  );

  // 최초 1회만 anchor로 쓸 초기 날짜를 고정
  const initialRef = useRef(dayjs().startOf('day'));

  // 선택된 날짜의 이벤트 필터
  const eventsForSelected = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD');
    return SAMPLE_EVENTS.filter(e => e.date === key);
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 상태 표시(선택 날짜/현재 월) */}
      <View style={styles.topBar}>
        <Text style={styles.monthText}>
          {currentMonth.format('YYYY년 MM월')}
        </Text>
        <Text style={styles.selectedText}>
          선택: {selectedDate.format('YYYY-MM-DD (ddd)')}
        </Text>
      </View>

      {/* 캘린더 */}
      <SwipeCalendarInfinite
        initialDate={initialRef.current}
        onMonthChange={m => setCurrentMonth(m.startOf('month'))}
        onSelectDate={d => setSelectedDate(d)} // <- 선택만 갱신
      />

      {/* 선택 날짜의 일정 리스트 */}
      <View style={styles.listHeader}>
        <Text style={styles.listHeaderText}>
          일정{' '}
          {eventsForSelected.length > 0 ? `(${eventsForSelected.length})` : ''}
        </Text>
      </View>

      <FlatList
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
          <Text style={styles.emptyText}>선택한 날짜에 일정이 없습니다.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  monthText: { fontSize: 20, fontWeight: '700' },
  selectedText: { marginTop: 4, fontSize: 14, color: '#666' },
  listHeader: { paddingHorizontal: 20, paddingVertical: 8 },
  listHeaderText: { fontSize: 16, fontWeight: '700' },
  eventCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f2f2f2',
    marginBottom: 10,
  },
  contentContainer: { paddingHorizontal: 20, paddingBottom: 24 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventTime: { marginTop: 4, fontSize: 13, color: '#666' },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 12 },
});
