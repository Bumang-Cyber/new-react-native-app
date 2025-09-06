import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import MonthCalendar from '../../calendar/monthCalendar';
import { scheduleOnRN } from 'react-native-worklets';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDatePress: (date: Date) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CalendarGrid = ({
  currentDate,
  selectedDate,
  onDatePress,
  onSwipeLeft,
  onSwipeRight,
}: CalendarGridProps) => {
  // -------- 제스처로 이전/다음달 넘기기 --------
  const translateX = useSharedValue(0);

  const handlePanGesture = Gesture.Pan()
    .onUpdate(event => {
      translateX.value = event.translationX;
    })
    .onEnd(event => {
      const threshold = SCREEN_WIDTH * 0.3;

      if (event.translationX > threshold) {
        // 이전 달로 이동
        translateX.value = withSpring(SCREEN_WIDTH, {}, () => {
          scheduleOnRN(onSwipeRight);
          translateX.value = 0;
        });
      } else if (event.translationX < -threshold) {
        // 다음 달로 이동
        translateX.value = withSpring(-SCREEN_WIDTH, {}, () => {
          scheduleOnRN(onSwipeLeft);
          translateX.value = 0;
        });
      } else {
        // 원래 위치로 돌아가기
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // -------- 캘린더 날짜 로직 --------

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

  const getRelativeMonthData = (origin: Date, to: number) => {
    const nextDate = new Date(origin);
    nextDate.setMonth(origin.getMonth() + to);
    return nextDate;
  };

  const startDateInCurrentMonth = currentDate;
  const startDateInPrevMonth = getRelativeMonthData(currentDate, -1);
  const startDateInNextMonth = getRelativeMonthData(currentDate, 1);

  const currentDays = getDaysInMonth(startDateInCurrentMonth);
  const prevDays = getDaysInMonth(startDateInPrevMonth);
  const nextDays = getDaysInMonth(startDateInNextMonth);

  return (
    <GestureDetector gesture={handlePanGesture}>
      <View style={styles.calendarGrid}>
        <Animated.View style={[styles.animatedContainer, animatedStyle]}>
          {/* 이전 달 */}
          <View style={[styles.monthContainer, { left: -SCREEN_WIDTH }]}>
            <MonthCalendar
              days={prevDays}
              referenceDate={startDateInPrevMonth}
              selectedDate={selectedDate}
              onDatePress={onDatePress}
              isVisible={false}
            />
          </View>

          {/* 현재 달 */}
          <View style={styles.monthContainer}>
            <MonthCalendar
              days={currentDays}
              referenceDate={startDateInCurrentMonth}
              selectedDate={selectedDate}
              onDatePress={onDatePress}
            />
          </View>

          {/* 다음 달 */}
          <View style={[styles.monthContainer, { left: SCREEN_WIDTH }]}>
            <MonthCalendar
              days={nextDays}
              referenceDate={startDateInNextMonth}
              selectedDate={selectedDate}
              onDatePress={onDatePress}
              isVisible={false}
            />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  calendarGrid: {
    // overflow: 'hidden',
    height: 310, // 캘린더 높이 고정 (6주 × 50px 정도)
  },
  animatedContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3, // 3개 달을 나란히
    height: '100%',
  },
  monthContainer: {
    width: SCREEN_WIDTH - 32, // padding 고려 (container padding 16 * 2)
    position: 'absolute',
    height: '100%',
  },
});

export default CalendarGrid;
