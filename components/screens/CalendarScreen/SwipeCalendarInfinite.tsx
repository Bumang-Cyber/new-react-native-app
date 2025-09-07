import React, {
  useCallback,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItemInfo,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isTodayPlugin from 'dayjs/plugin/isToday';
dayjs.extend(isoWeek);
dayjs.extend(isTodayPlugin);

type Props = {
  initialDate?: Dayjs | string | Date;
  onMonthChange?: (m: Dayjs) => void;
  onSelectDate?: (d: Dayjs) => void;
  weekStartsOn?: 0 | 1; // 0=일, 1=월
  weekdayLabels?: string[];
};

export type SwipeCalendarHandle = {
  goPrevMonth: () => void;
  goNextMonth: () => void;
  scrollToMonthOffset: (offset: number) => void; // anchor 기준 offset로 스크롤
};

type Cell = { date: Dayjs; inMonth: boolean };

// ── 링 버퍼 파라미터 ──────────────────────────────────────────────
const WINDOW = 48; // 고정 페이지 수 (예: 4년)
const SHIFT = WINDOW / 2; // 워프 이동 칸수 (보통 WINDOW/2)
const CENTER = Math.floor(WINDOW / 2);
const PRELOAD_THRESHOLD = 4; // 가장자리 감지 임계치

// ── 레이아웃 ─────────────────────────────────────────────────────
const SIDE_PAD = 12; // styles.monthContainer.paddingHorizontal 과 동일해야 함

const defaultWeekdayLabelsKoMonStart = [
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
  '일',
];
const defaultWeekdayLabelsKoSunStart = [
  '일',
  '월',
  '화',
  '수',
  '목',
  '금',
  '토',
];

function makeRange(n: number) {
  return Array.from({ length: n }, (_, i) => i);
}

const SwipeCalendarInfinite = forwardRef<SwipeCalendarHandle, Props>(function C(
  { initialDate, onMonthChange, onSelectDate, weekStartsOn = 1, weekdayLabels },
  ref,
) {
  const { width } = useWindowDimensions();

  // 1주 7칸 정확히 표시 (픽셀 고정)
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cellWidth = Math.floor(contentWidth / 7);
  const gridWidth = cellWidth * 7;

  // anchor는 최초 1회 고정
  const anchorRef = useRef(dayjs(initialDate ?? new Date()).startOf('month'));
  const anchor = anchorRef.current;

  // 링 버퍼: data는 고정 길이
  const data = useMemo(() => makeRange(WINDOW), []);

  // 기준 오프셋(월) 누적 값
  const baseOffsetRef = useRef(0);

  // 현재 보이는 인덱스/월
  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(anchor);
  const lastIndexRef = useRef<number>(CENTER);

  // 선택 날짜
  const [selected, setSelected] = useState<Dayjs | null>(
    dayjs(initialDate ?? anchor).startOf('day'),
  );

  const labels =
    weekdayLabels ??
    (weekStartsOn === 1
      ? defaultWeekdayLabelsKoMonStart
      : defaultWeekdayLabelsKoSunStart);

  // index -> anchor로부터의 실제 month offset
  const offsetFromIndex = useCallback(
    (index: number) => baseOffsetRef.current + (index - CENTER),
    [],
  );

  // 실제 month 계산
  const monthFromIndex = useCallback(
    (index: number) => anchor.add(offsetFromIndex(index), 'month'),
    [anchor, offsetFromIndex],
  );

  // 42칸(6주) 그리드 생성
  const buildMonthMatrix = useCallback(
    (month: Dayjs): Cell[] => {
      const start = month.startOf('month');
      const firstWeekday = start.day(); // 0(일)~6(토)
      const offset =
        weekStartsOn === 1 ? (firstWeekday - 1 + 7) % 7 : firstWeekday;
      const gridStart = start.subtract(offset, 'day');

      const out: Cell[] = [];
      for (let i = 0; i < 42; i++) {
        const d = gridStart.add(i, 'day');
        out.push({ date: d, inMonth: d.isSame(month, 'month') });
      }
      return out;
    },
    [weekStartsOn],
  );

  const renderItem = useCallback(
    ({ index }: ListRenderItemInfo<number>) => {
      const month = monthFromIndex(index);
      const cells = buildMonthMatrix(month);

      return (
        <View style={[styles.monthContainer, { width }]}>
          <Text style={styles.monthTitle}>{month.format('YYYY년 MM월')}</Text>

          {/* 요일 헤더: 픽셀 고정 */}
          <View style={[styles.weekHeader, { width: gridWidth }]}>
            {labels.map((l, i) => {
              const isWeekend =
                weekStartsOn === 1 ? i >= 5 : i === 0 || i === 6;
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

          {/* 날짜 그리드: 픽셀 고정 */}
          <View style={[styles.grid, { width: gridWidth }]}>
            {cells.map(cell => {
              const key = cell.date.format('YYYY-MM-DD');
              const isToday = cell.date.isToday();
              const isSelected =
                !!selected && cell.date.isSame(selected, 'day');

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.cell,
                    { width: cellWidth },
                    isSelected && styles.cellSelected,
                    isToday && styles.cellToday,
                  ]}
                  onPress={() => {
                    const d = cell.date.startOf('day');
                    setSelected(d);
                    onSelectDate?.(d);
                  }}
                >
                  <Text
                    style={[
                      styles.cellText,
                      !cell.inMonth && styles.dimmedText,
                      isSelected && styles.cellTextSelected,
                    ]}
                  >
                    {cell.date.date()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    [
      buildMonthMatrix,
      labels,
      monthFromIndex,
      selected,
      width,
      gridWidth,
      cellWidth,
      onSelectDate,
      weekStartsOn,
    ],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  // 워프 중 중복 처리를 막기 위한 플래그
  const teleportingRef = useRef(false);

  const onViewableItemsChanged = useRef(
    (info: {
      viewableItems: Array<ViewToken<number>>;
      changed: Array<ViewToken<number>>;
    }) => {
      if (teleportingRef.current) return;

      const token = info.viewableItems[0];
      const i = token?.index ?? null;
      if (i == null) return;

      lastIndexRef.current = i;

      const m = monthFromIndex(i);
      setVisibleMonth(m);
      onMonthChange?.(m);

      // 가장자리에 가까워지면 중앙 쪽으로 '워프'
      if (i <= PRELOAD_THRESHOLD) {
        teleportingRef.current = true;
        baseOffsetRef.current -= SHIFT; // 기준 오프셋 이동(실제 과거로 확장한 효과)
        const nextIndex = i + SHIFT; // 화면상 동일 위치 유지
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
          // 워프 후 보이는 월 재동기화
          const mm = monthFromIndex(nextIndex);
          setVisibleMonth(mm);
          onMonthChange?.(mm);
          lastIndexRef.current = nextIndex;
          teleportingRef.current = false;
        });
      } else if (i >= WINDOW - 1 - PRELOAD_THRESHOLD) {
        teleportingRef.current = true;
        baseOffsetRef.current += SHIFT; // 기준 오프셋 이동(실제 미래로 확장한 효과)
        const nextIndex = i - SHIFT;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
          const mm = monthFromIndex(nextIndex);
          setVisibleMonth(mm);
          onMonthChange?.(mm);
          lastIndexRef.current = nextIndex;
          teleportingRef.current = false;
        });
      }
    },
  ).current;

  // 헤더 제어용 메서드
  const listRef = useRef<FlatList<number>>(null);
  useImperativeHandle(ref, () => ({
    goPrevMonth() {
      const idx = Math.max(0, lastIndexRef.current - 1);
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    },
    goNextMonth() {
      const idx = Math.min(WINDOW - 1, lastIndexRef.current + 1);
      listRef.current?.scrollToIndex({ index: idx, animated: true });
    },
    scrollToMonthOffset(targetOffset: number) {
      // baseOffsetRef + (index - CENTER) = targetOffset → index = targetOffset - base + CENTER
      const idx = targetOffset - baseOffsetRef.current + CENTER;
      if (idx >= 0 && idx < WINDOW) {
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      } else {
        // 범위를 벗어나면 기준을 재조정 후 중앙으로 텔레포트
        teleportingRef.current = true;
        baseOffsetRef.current = targetOffset; // 중앙(CENTER)이 targetOffset이 되도록
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: CENTER, animated: false });
          const mm = monthFromIndex(CENTER);
          setVisibleMonth(mm);
          onMonthChange?.(mm);
          lastIndexRef.current = CENTER;
          teleportingRef.current = false;
        });
      }
    },
  }));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {visibleMonth.format('YYYY년 MM월')}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={data}
        horizontal
        pagingEnabled
        keyExtractor={i => String(i)}
        renderItem={renderItem}
        initialScrollIndex={CENTER}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 51 }}
        showsHorizontalScrollIndicator={false}
        windowSize={3}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews
      />
    </View>
  );
});

export default SwipeCalendarInfinite;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerText: { fontSize: 20, fontWeight: '700' },

  monthContainer: { paddingHorizontal: SIDE_PAD, paddingBottom: 12 },
  monthTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },

  weekHeader: { flexDirection: 'row', marginBottom: 6 },
  weekday: { textAlign: 'center', fontSize: 12, fontWeight: '600' },
  weekend: { color: '#c03' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2, // 가로 마진 금지
  },
  cellToday: { borderWidth: 1, borderColor: '#888' },
  cellSelected: { backgroundColor: '#222' },
  cellText: { fontSize: 14 },
  cellTextSelected: { color: 'white', fontWeight: '700' },
  dimmedText: { color: '#aaa' },
});
