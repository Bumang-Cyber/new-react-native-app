// CollapsibleCalendarTabs.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { cancelAnimation } from 'react-native-reanimated';

type Props = {
  selected: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  renderDiet: () => React.ReactNode; // 식단 탭 콘텐츠
  renderWorkout: () => React.ReactNode; // 운동 탭 콘텐츠
  renderBody: () => React.ReactNode; // 신체 탭 콘텐츠
};

const labels = ['일', '월', '화', '수', '목', '금', '토'];

const WEEK_STARTS_ON: 0 | 1 = 0; // 필요시 1(월요일 시작)
const startOfWeek = (d: Dayjs, weekStartsOn: 0 | 1 = WEEK_STARTS_ON) => {
  const w = d.day();
  const off = weekStartsOn === 1 ? (w + 6) % 7 : w;
  return d.startOf('day').subtract(off, 'day');
};
const clampDay = (prev: Dayjs, targetMonthStart: Dayjs) => {
  const day = Math.min(prev.date(), targetMonthStart.daysInMonth());
  return targetMonthStart.date(day);
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
  const [cursorDate, setCursorDate] = useState<Dayjs>(selected);

  const monthAnchor = useMemo(() => cursorDate.startOf('month'), [cursorDate]);
  const weekAnchor = useMemo(() => startOfWeek(cursorDate), [cursorDate]);

  const syncingRef = useRef<null | 'month' | 'week'>(null);
  // 각 뷰가 실제로 보여주고 있는 앵커(중복 워프 방지)
  const visibleMonthRef = useRef<Dayjs>(monthAnchor);
  const visibleWeekRef = useRef<Dayjs>(weekAnchor);

  const weekdayPrefRef = useRef<number>(selected.day());

  // 날짜 탭 핸들러: 선택 + 기준 동기화 (+ 요일 선호 갱신)
  const handleSelectDate = (d: Dayjs) => {
    onSelectDate(d);
    setCursorDate(prev => (sameDay(prev, d) ? prev : d));
    weekdayPrefRef.current = d.day();
  };

  const sameDay = (a: Dayjs, b: Dayjs) => a.isSame(b, 'day');
  const sameMonth = (a: Dayjs, b: Dayjs) => a.isSame(b, 'month');

  // 월/주 좌우 스와이프 → cursorDate만 갱신
  const handleMonthChange = (m: Dayjs) => {
    const mStart = m.startOf('month');
    visibleMonthRef.current = mStart;

    if (syncingRef.current === 'month') return; // 프로그램 워프 중이면 무시

    setCursorDate(prev => {
      const next = clampDay(prev, mStart);
      // 같은 날짜면 setState 스킵
      if (sameDay(prev, next)) return prev;

      // 주 뷰를 같은 컨텍스트로 미리 워프(필요할 때만)
      const targetWeek = startOfWeek(next);
      if (
        !visibleWeekRef.current ||
        !visibleWeekRef.current.isSame(targetWeek, 'day')
      ) {
        syncingRef.current = 'week';
        weekRef.current?.goToWeek?.(targetWeek, {
          animated: false,
          select: false,
        });
        visibleWeekRef.current = targetWeek;
        syncingRef.current = null;
      }
      return next;
    });
  };
  const handleWeekChange = (ws: Dayjs) => {
    visibleWeekRef.current = ws;

    if (syncingRef.current === 'week') return; // 프로그램 워프 중이면 무시

    const pref = (weekdayPrefRef.current ?? 0) % 7;
    const next = ws.add(pref, 'day');

    setCursorDate(prev => (sameDay(prev, next) ? prev : next));

    // 월 뷰도 같은 컨텍스트로 미리 워프(필요할 때만)
    const targetMonth = next.startOf('month');
    if (
      !visibleMonthRef.current ||
      !sameMonth(visibleMonthRef.current, targetMonth)
    ) {
      syncingRef.current = 'month';
      monthRef.current?.goToDate?.(next, { animated: false, select: false });
      visibleMonthRef.current = targetMonth;
      syncingRef.current = null;
    }
  };

  useEffect(() => {
    if (mode === 'month') {
      const targetMonth = cursorDate.startOf('month');
      if (
        !visibleMonthRef.current ||
        !sameMonth(visibleMonthRef.current, targetMonth)
      ) {
        syncingRef.current = 'month';
        monthRef.current?.goToDate?.(cursorDate, {
          animated: false,
          select: false,
        });
        visibleMonthRef.current = targetMonth;
        syncingRef.current = null;
      }
    } else {
      const targetWeek = startOfWeek(cursorDate);
      if (
        !visibleWeekRef.current ||
        !visibleWeekRef.current.isSame(targetWeek, 'day')
      ) {
        syncingRef.current = 'week';
        weekRef.current?.goToWeek?.(targetWeek, {
          animated: false,
          select: false,
        });
        visibleWeekRef.current = targetWeek;
        syncingRef.current = null;
      }
    }
    // cursorDate만 의존: 내부 visible*Ref 비교로 중복 호출 방지
  }, [mode, cursorDate]);

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
    .onStart(() => {
      cancelAnimation(progress); // 레이스 방지
    })
    .onUpdate(e => {
      const p = start.value + -e.translationY / SAFE_DELTA;
      progress.value = Math.max(0, Math.min(1, p)); // clamp
    })
    .onEnd(e => {
      'worklet';
      // 임계만 사용(간단/안정). 필요하면 velocity 가중 추가 가능
      const toWeek = progress.value > 0.5 || -e.velocityY > 800;
      runOnJS(setMode)(toWeek ? 'week' : 'month'); // 모드만 즉시
      progress.value = withSpring(toWeek ? 1 : 0, {
        damping: 18,
        stiffness: 180,
      });
    })
    .activeOffsetX([-15, 15]) // 수평 브러시 스와이프와 충돌 줄이기
    .minDistance(3);

  return (
    <View style={styles.container}>
      {/* 월 표기 */}
      <View style={styles.calendarTitle}>
        <Animated.Text style={[styles.title, styles.absolute, weekFade]}>
          {weekAnchor.format('YYYY년 MM월')}
        </Animated.Text>
        <Animated.Text style={[styles.title, styles.absolute, monthFade]}>
          {monthAnchor.format('YYYY년 MM월')}
        </Animated.Text>
      </View>

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
            selected={selected}
            initialDate={selected}
            onMonthChange={handleMonthChange}
            onSelectDate={handleSelectDate}
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
            onSelectDate={handleSelectDate}
            onWeekChange={handleWeekChange}
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
  calendarTitle: {
    position: 'relative',
    width: '100%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  absolute: {
    position: 'absolute',
  },
  title: {
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
