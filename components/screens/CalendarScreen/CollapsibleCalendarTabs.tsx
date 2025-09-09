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
import { SIDE_PAD } from '../../../constants/layout';

type Props = {
  selected: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  renderDiet: () => React.ReactNode; // 식단 탭 콘텐츠
  renderWorkout: () => React.ReactNode; // 운동 탭 콘텐츠
  renderBody: () => React.ReactNode; // 신체 탭 콘텐츠
};

const labels = ['일', '월', '화', '수', '목', '금', '토'];

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
  // ---------------------- Refs ----------------------
  const monthRef = useRef<SwipeMonthCalendarHandle>(null);
  const weekRef = useRef<SwipeWeekHandle>(null);

  // ---------------------- 레이아웃 변수 ----------------------
  const { width } = useWindowDimensions();
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cellWidth = Math.floor(contentWidth / 7);
  const gridWidth = cellWidth * 7;
  const cell = Math.floor(contentWidth / 7);

  const MONTH_H = cell * 6;
  const WEEK_H = cell * 1;
  const DELTA = MONTH_H - WEEK_H;

  const [mode, setMode] = useState<'month' | 'week'>('month');

  // 보이는 달/주(전환 동기화 규칙용)
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(
    selected.startOf('month'),
  );
  const [visibleWeekStart, setVisibleWeekStart] = useState<Dayjs>(
    startOfWeek(selected),
  );

  const titleByCalendarMode =
    mode === 'month'
      ? visibleMonth.format('YYYY년 MM월')
      : visibleWeekStart.format('YYYY년 MM월');

  // ---------------------- 애니메이션 ----------------------
  // 진행도(0=월, 1=주) + 모드(state는 포인터 이벤트 제어용)
  const progress = useSharedValue(0);
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

  return (
    <View style={styles.container}>
      {/* 월 표기 */}
      <Text style={styles.monthTitle}>{titleByCalendarMode}</Text>

      {/* 요일 헤더: 픽셀 고정 */}
      <View style={[styles.weekHeader, { width: gridWidth }]}>
        {labels.map((l, i) => {
          const isWeekend = i === 0 || i === 6;
          return (
            <Text
              key={i}
              style={[
                styles.weekday,
                { width: cellWidth },
                isWeekend && styles.weekend,
              ]}
            >
              {l}
            </Text>
          );
        })}
      </View>

      {/* 캘린더 영역 (월/주 겹침) */}
      <Animated.View style={[styles.calendar, calStyle]}>
        {/* 월간 */}
        <Animated.View
          style={[styles.fill, monthFade]}
          pointerEvents={mode === 'month' ? 'auto' : 'none'}
        >
          <SwipeMonthCalendarInfinite
            ref={monthRef}
            initialDate={selected}
            onMonthChange={m => setVisibleMonth(m.startOf('month'))}
            onSelectDate={onSelectDate}
            // 레이아웃 props
            gridWidth={gridWidth}
            cellWidth={cellWidth}
            width={width}
          />
        </Animated.View>

        {/* 주간 */}
        <Animated.View
          style={[styles.fill, weekFade]}
          pointerEvents={mode === 'week' ? 'auto' : 'none'}
        >
          <SwipeWeekInfinite
            ref={weekRef}
            selected={selected}
            onSelectDate={onSelectDate}
            onWeekChange={ws => setVisibleWeekStart(ws)}
            // 레이아웃 props
            gridWidth={gridWidth}
            cellWidth={cellWidth}
            width={width}
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
  monthTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 32,
  },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: SIDE_PAD,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  weekend: {
    color: '#c03',
  },

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
