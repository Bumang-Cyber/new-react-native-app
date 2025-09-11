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
  withTiming,
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
import Icon from 'react-native-vector-icons/FontAwesome6';
import { PressableBase } from '@/components/pressableBase';
import useTabTextStyle from '@/hook/useTabAnimateStyle';

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
  // ---------------------- Calendar Refs ----------------------
  const monthCalendarRef = useRef<SwipeMonthCalendarHandle>(null);
  const weekCalendarRef = useRef<SwipeWeekHandle>(null);

  // ---------------------- 레이아웃 변수 ----------------------
  const { width } = useWindowDimensions();
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cellWidth = Math.floor(contentWidth / 7);
  const gridWidth = cellWidth * 7;
  const cell = Math.floor(contentWidth / 7);

  const MONTH_H = cell * 6;
  const WEEK_H = cell * 1;
  const DELTA = MONTH_H - WEEK_H;

  // ---------------------- 달력 데이터 ----------------------

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // 화면의 단 하나의 기준 날짜
  const [cursorDate, setCursorDate] = useState<Dayjs>(selected);
  // focusDate가 속한 월/주의 1일
  const monthStart = useMemo(() => cursorDate.startOf('month'), [cursorDate]);
  const weekStart = useMemo(() => startOfWeek(cursorDate), [cursorDate]);

  // 스와이핑으로 viewMode 전환 시 시작했던 방향을 정적으로 기억하는 ref
  const syncingRef = useRef<null | 'month' | 'week'>(null);

  // 월간 뷰가 실제로 보여주는 달 시작
  const monthViewportStartRef = useRef<Dayjs>(monthStart);
  // 주간 뷰가 실제로 보여주는 주 시작
  const weekViewportStartRef = useRef<Dayjs>(weekStart);

  const preferredWeekdayRef = useRef<number>(selected.day());

  // ---------------------- 날짜 관련 함수 ----------------------

  // 날짜 탭 핸들러: 선택 + 기준 동기화 (+ 요일 선호 갱신)
  const handleSelectDate = (d: Dayjs) => {
    onSelectDate(d);
    setCursorDate(prev => (isSameDay(prev, d) ? prev : d));
    preferredWeekdayRef.current = d.day();
  };

  const isSameDay = (a: Dayjs, b: Dayjs) => a.isSame(b, 'day');
  const isSameMonth = (a: Dayjs, b: Dayjs) => a.isSame(b, 'month');

  // 월/주 좌우 스와이프 → cursorDate만 갱신
  const handleMonthChange = (m: Dayjs) => {
    const mStart = m.startOf('month');
    monthViewportStartRef.current = mStart;

    if (syncingRef.current === 'month') return; // 프로그램 워프 중이면 무시

    setCursorDate(prev => {
      const next = clampDay(prev, mStart);
      // 같은 날짜면 setState 스킵
      if (isSameDay(prev, next)) return prev;

      // 주 뷰를 같은 컨텍스트로 미리 워프(필요할 때만)
      const targetWeek = startOfWeek(next);
      if (
        !weekViewportStartRef.current ||
        !weekViewportStartRef.current.isSame(targetWeek, 'day')
      ) {
        syncingRef.current = 'week';
        weekCalendarRef.current?.goToWeek?.(targetWeek, {
          animated: false,
          select: false,
        });
        weekViewportStartRef.current = targetWeek;
        syncingRef.current = null;
      }
      return next;
    });
  };
  const handleWeekChange = (ws: Dayjs) => {
    weekViewportStartRef.current = ws;

    if (syncingRef.current === 'week') return; // 프로그램 워프 중이면 무시

    const pref = (preferredWeekdayRef.current ?? 0) % 7;
    const next = ws.add(pref, 'day');

    setCursorDate(prev => (isSameDay(prev, next) ? prev : next));

    // 월 뷰도 같은 컨텍스트로 미리 워프(필요할 때만)
    const targetMonth = next.startOf('month');
    if (
      !monthViewportStartRef.current ||
      !isSameMonth(monthViewportStartRef.current, targetMonth)
    ) {
      syncingRef.current = 'month';
      monthCalendarRef.current?.goToDate?.(next, {
        animated: false,
        select: false,
      });
      monthViewportStartRef.current = targetMonth;
      syncingRef.current = null;
    }
  };

  const handleGoPrev = () => {
    if (syncingRef.current) return;
    cancelAnimation(progress); // 레이스 방지

    if (viewMode === 'month') {
      monthCalendarRef.current?.goPrevMonth();
    } else {
      weekCalendarRef.current?.goPrevWeek();
    }
  };

  const handleGoNext = () => {
    cancelAnimation(progress); // 레이스 방지

    if (viewMode === 'month') {
      monthCalendarRef.current?.goNextMonth();
    } else {
      weekCalendarRef.current?.goNextWeek();
    }
  };

  useEffect(() => {
    if (viewMode === 'month') {
      const targetMonth = cursorDate.startOf('month');
      if (
        !monthViewportStartRef.current ||
        !isSameMonth(monthViewportStartRef.current, targetMonth)
      ) {
        syncingRef.current = 'month';
        monthCalendarRef.current?.goToDate?.(cursorDate, {
          animated: false,
          select: false,
        });
        monthViewportStartRef.current = targetMonth;
        syncingRef.current = null;
      }
    } else {
      const targetWeek = startOfWeek(cursorDate);
      if (
        !weekViewportStartRef.current ||
        !weekViewportStartRef.current.isSame(targetWeek, 'day')
      ) {
        syncingRef.current = 'week';
        weekCalendarRef.current?.goToWeek?.(targetWeek, {
          animated: false,
          select: false,
        });
        weekViewportStartRef.current = targetWeek;
        syncingRef.current = null;
      }
    }
    // cursorDate만 의존: 내부 visible*Ref 비교로 중복 호출 방지
  }, [viewMode, cursorDate]);

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
      runOnJS(setViewMode)(toWeek ? 'week' : 'month'); // 모드만 즉시
      progress.value = withSpring(toWeek ? 1 : 0, {
        damping: 18,
        stiffness: 180,
      });
    })
    .activeOffsetX([-15, 15]) // 수평 브러시 스와이프와 충돌 줄이기
    .minDistance(3);

  const [page, setPage] = useState(0); // 페이지
  const [tabW, setTabW] = useState(0); // 탭 바 전체 폭
  const tabPos = useSharedValue(0); // 0,1,2

  const pagerRef = useRef<PagerView>(null);
  const tabBgStyle = useAnimatedStyle(() => ({
    left: (tabW / 3) * tabPos.value,
  }));

  const dietTextStyle = useTabTextStyle(0, tabPos);
  const workoutTextStyle = useTabTextStyle(1, tabPos);
  const bodyTextStyle = useTabTextStyle(2, tabPos);

  const goPage = (idx: number) => {
    pagerRef.current?.setPage(idx);
    // 클릭은 살짝만 애니메이션 (짧게)
    tabPos.value = withTiming(idx);
  };

  return (
    <View style={styles.container}>
      {/* 월/달 전환 버튼 */}
      <View style={styles.calendarSwiperContainer}>
        <PressableBase
          onPress={handleGoPrev}
          style={styles.calendarSwiper}
          pressScale={0.9}
          pressOpacity={0.6}
          debounceMs={800}
          accessibilityLabel={viewMode === 'month' ? '전월' : '전주'}
        >
          <Icon name="angle-left" size={16} style={styles.arrowLeft} />
        </PressableBase>
        <PressableBase
          onPress={handleGoNext}
          style={styles.calendarSwiper}
          pressScale={0.9}
          pressOpacity={0.6}
          debounceMs={800}
          accessibilityLabel={viewMode === 'month' ? '익월' : '차주'}
        >
          <Icon name="angle-right" size={16} style={styles.arrowRight} />
        </PressableBase>
      </View>

      {/* 월 표기 */}
      <View style={styles.calendarTitle}>
        <Animated.Text style={[styles.title, styles.absolute, monthFade]}>
          {monthStart.format('YYYY년 MM월')}
        </Animated.Text>
        <Animated.Text style={[styles.title, styles.absolute, weekFade]}>
          {weekStart.format('YYYY년 MM월')}
        </Animated.Text>
      </View>

      {/* 요일 헤더: 픽셀 고정 */}
      <View style={[styles.weekHeader, { width: gridWidth }]}>
        {labels.map((l, i) => {
          const isSunday = i === 0;
          const isSaturday = i === 6;
          return (
            <Text
              key={i}
              style={[
                styles.weekday,
                { width: cellWidth },
                isSunday && styles.sunday,
                isSaturday && styles.saturday,
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
          pointerEvents={viewMode === 'month' ? 'auto' : 'none'}
        >
          <SwipeMonthCalendarInfinite
            ref={monthCalendarRef}
            selected={selected}
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
          pointerEvents={viewMode === 'week' ? 'auto' : 'none'}
        >
          <SwipeWeekInfinite
            ref={weekCalendarRef}
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

      {/* 탭 인디케이터 */}
      <View style={styles.tabIndicatorContainer}>
        <View
          style={styles.tabIndicatorInner}
          onLayout={e => setTabW(e.nativeEvent.layout.width)}
        >
          <Animated.View style={[styles.tabIndicatorBackground, tabBgStyle]} />
          <PressableBase
            style={styles.tabIndicatorItem}
            onPress={() => goPage(0)}
          >
            <Animated.Text style={[styles.tabIndicatorItemText, dietTextStyle]}>
              식단
            </Animated.Text>
          </PressableBase>

          <PressableBase
            style={styles.tabIndicatorItem}
            onPress={() => goPage(1)}
          >
            <Animated.Text
              style={[styles.tabIndicatorItemText, workoutTextStyle]}
            >
              운동
            </Animated.Text>
          </PressableBase>

          <PressableBase
            style={styles.tabIndicatorItem}
            onPress={() => goPage(2)}
          >
            <Animated.Text style={[styles.tabIndicatorItemText, bodyTextStyle]}>
              신체
            </Animated.Text>
          </PressableBase>
        </View>
      </View>

      {/* 탭 콘텐츠 (PagerView) */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageScroll={e => {
          const { position, offset } = e.nativeEvent; // position: 정수 페이지, offset: 0~1
          // 스와이프 중엔 애니메이션 없이 즉시 반영 → 거의 동시에 움직임
          const idx = e.nativeEvent.position;
          setPage(idx);
          tabPos.value = position + offset;
        }}
      >
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
  // 전월/익월, 전주/차주 전환 버튼 스타일
  calendarSwiperContainer: {
    width: '100%',
    height: 44,
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 180,
  },
  calendarSwiper: {
    width: 30,
    height: 30,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowLeft: {
    transform: [{ translateX: -1 }],
  },
  arrowRight: {
    transform: [{ translateX: 1 }],
  },

  // 캘린더 타이틀 스타일
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

  // 요일 표기 스타일
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
  sunday: {
    color: '#E8B08E',
  },
  saturday: {
    color: '#89CFF0',
  },

  // 달력 스타일
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

  // 시트 스타일
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: '#f9f9f9',
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

  // 탭 인디케이터 스타일
  tabIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  tabIndicatorInner: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#d9d9d9',
  },
  tabIndicatorBackground: {
    position: 'absolute',
    backgroundColor: '#111',
    height: '100%',
    width: '33.3%',
    zIndex: -1,
    borderRadius: 8,
    left: 0,
  },
  tabIndicatorItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabSelected: {
    color: 'white',
  },
  tabIndicatorItemText: {
    color: 'black',
  },
  tabIndicatorItemLeft: {},
  tabIndicatorItemRight: {},

  // 탭 콘텐츠 스타일
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
