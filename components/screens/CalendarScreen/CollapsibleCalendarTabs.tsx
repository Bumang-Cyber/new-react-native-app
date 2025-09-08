// CollapsibleCalendarTabs.tsx
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import { Dayjs } from 'dayjs';

import SwipeMonthCalendarInfinite, {
  SwipeMonthCalendarHandle,
} from './SwipeMonthCalendarInfinite';
import SwipeWeekInfinite, {
  SwipeWeekHandle,
} from './SwipeWeekCalendarInfinite';
import { scheduleOnRN } from 'react-native-worklets';

type Props = {
  selected: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  renderDiet: () => React.ReactNode; // 식단 탭 콘텐츠
  renderWorkout: () => React.ReactNode; // 운동 탭 콘텐츠
  renderBody: () => React.ReactNode; // 신체 탭 콘텐츠
};

const SIDE_PAD = 12;

const startOfWeek = (d: Dayjs, weekStartsOn: 0 | 1 = 0) => {
  const w = d.day();
  const off = weekStartsOn === 1 ? (w + 6) % 7 : w;
  return d.startOf('day').subtract(off, 'day');
};

export default function CollapsibleCalendarTabs({
  selected,
  onSelectDate,
  renderDiet,
  renderWorkout,
  renderBody,
}: Props) {
  const calRef = useRef<SwipeMonthCalendarHandle>(null);
  const weekRef = useRef<SwipeWeekHandle>(null);
  const { width } = useWindowDimensions();

  // 레이아웃 값
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cell = Math.floor(contentWidth / 7);
  const monthTitleH = 32; // month일때 타이틀 높이
  const weekdayH = 22; // 요일 헤더
  const MONTH_H = monthTitleH + weekdayH + cell * 6 + 16;
  const WEEK_H = monthTitleH + weekdayH + cell * 1 + 16;
  const DELTA = MONTH_H - WEEK_H;

  // 진행도(0=월, 1=주) + 모드(state는 포인터 이벤트 제어용)
  const progress = useSharedValue(0);
  const [mode, setMode] = useState<'month' | 'week'>('month');

  // 보이는 달/주(전환 동기화 규칙용)
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(
    selected.startOf('month'),
  );
  const [visibleWeekStart, setVisibleWeekStart] = useState<Dayjs>(
    startOfWeek(selected),
  );

  // 캘린더 높이/페이드
  const calStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [MONTH_H, WEEK_H],
      Extrapolation.CLAMP,
    ),
  }));
  const monthFade = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const weekFade = useAnimatedStyle(() => ({ opacity: progress.value }));

  const start = useSharedValue(0);
  const SAFE_DELTA = Math.max(1, DELTA); // 2) 0 방지
  const pan = Gesture.Pan()
    .onBegin(() => {
      start.value = progress.value; // 시작 시점 진행도 스냅샷
    })
    .onUpdate(e => {
      const p = start.value + -e.translationY / SAFE_DELTA;
      progress.value = Math.max(0, Math.min(1, p)); // clamp
    })
    .onEnd(e => {
      const snapToWeek = progress.value > 0.35 || -e.velocityY > 600;
      progress.value = withSpring(
        snapToWeek ? 1 : 0,
        { damping: 18, stiffness: 180 },
        () => {
          runOnJS(setMode)(snapToWeek ? 'week' : 'month');
        },
      );
    })
    .activeOffsetX([-15, 15]) // 수평 브러시 스와이프와 충돌 줄이기
    .minDistance(3);

  // 드래그 핸들
  // const onGestureEvent = (evt: any) => {
  //   const { translationY, velocityY, state } = evt.nativeEvent ?? evt; // GH v2/v3 호환용
  // };

  return (
    <View style={styles.container}>
      {/* 캘린더 영역 (월/주 겹침) */}
      <Animated.View style={[styles.calendar, calStyle]}>
        <Animated.View
          style={[styles.fill, monthFade]}
          pointerEvents={mode === 'month' ? 'auto' : 'none'}
        >
          <SwipeMonthCalendarInfinite
            ref={calRef}
            initialDate={selected}
            onMonthChange={m => setVisibleMonth(m.startOf('month'))}
            onSelectDate={onSelectDate}
          />
        </Animated.View>

        <Animated.View
          style={[styles.fill, weekFade]}
          pointerEvents={mode === 'week' ? 'auto' : 'none'}
        >
          <SwipeWeekInfinite
            ref={weekRef}
            selected={selected}
            onSelectDate={onSelectDate}
            onWeekChange={ws => setVisibleWeekStart(ws)}
          />
        </Animated.View>
      </Animated.View>

      {/* 드래그 핸들(탭 헤더) */}
      <GestureDetector gesture={pan}>
        <Animated.View style={styles.sheetHeader}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {selected.format('YYYY.MM.DD (ddd)')}
          </Text>
        </Animated.View>
      </GestureDetector>

      {/* 탭 콘텐츠 (PagerView) */}
      <PagerView style={styles.pager} initialPage={0}>
        <View key="diet" style={styles.page}>
          {renderDiet()}
        </View>
        <View key="workout" style={styles.page}>
          {renderWorkout()}
        </View>
        <View key="body" style={styles.page}>
          {renderBody()}
        </View>
      </PagerView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendar: {
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d0d0d0',
    marginBottom: 8,
  },
  sheetTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#555',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    padding: 16,
  },
});
