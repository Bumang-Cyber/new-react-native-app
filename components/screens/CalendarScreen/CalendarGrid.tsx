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
      const threshold = SCREEN_WIDTH * 0.25;

      if (event.translationX > threshold) {
        // 오른쪽 스와이프 - 이전 달
        translateX.value = withSpring(
          SCREEN_WIDTH,
          { damping: 20, stiffness: 90 },
          finished => {
            if (finished) {
              // 상태 변경과 동시에 translateX 초기화
              scheduleOnRN(() => {
                onSwipeRight();
                translateX.value = 0;
              });
            }
          },
        );
      } else if (event.translationX < -threshold) {
        // 왼쪽 스와이프 - 다음 달
        translateX.value = withSpring(
          -SCREEN_WIDTH,
          { damping: 20, stiffness: 90 },
          finished => {
            if (finished) {
              // 상태 변경과 동시에 translateX 초기화
              scheduleOnRN(() => {
                onSwipeLeft();
                translateX.value = 0;
              });
            }
          },
        );
      } else {
        // 임계값 미달 - 원위치
        translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // -------- 캘린더 날짜 로직 --------
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);

    startDate.setDate(1 - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(year, month, 1 + i - firstDay.getDay());
      days.push(day);
    }
    return days;
  };

  const getRelativeMonthData = (origin: Date, offset: number) => {
    const date = new Date(origin);
    date.setMonth(origin.getMonth() + offset);
    return date;
  };

  // 현재 표시 중인 월과 인접한 월들의 데이터 계산
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
            />
          </View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  calendarGrid: {
    overflow: 'hidden',
    height: 310,
  },
  animatedContainer: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 3,
    height: '100%',
  },
  monthContainer: {
    width: SCREEN_WIDTH - 32,
    position: 'absolute',
    height: '100%',
  },
});

export default CalendarGrid;
