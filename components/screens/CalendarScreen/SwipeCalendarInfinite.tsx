import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
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

const CHUNK = 24;
const PRELOAD_THRESHOLD = 4;

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

function makeRange(start: number, end: number) {
  const arr: number[] = [];
  for (let i = start; i <= end; i++) arr.push(i);
  return arr;
}

const SIDE_PAD = 12; // styles.monthContainer.paddingHorizontal 과 동일해야 함

const SwipeCalendarInfinite = forwardRef<SwipeCalendarHandle, Props>(function C(
  { initialDate, onMonthChange, onSelectDate, weekStartsOn = 1, weekdayLabels },
  ref,
) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cellWidth = Math.floor(contentWidth / 7);
  const gridWidth = cellWidth * 7;

  // ✅ anchor는 최초 1회만 고정 (prop 변경에 영향받지 않음)
  const anchorRef = useRef(dayjs(initialDate ?? new Date()).startOf('month'));
  const anchor = anchorRef.current;

  // offsets: 0=anchor 월
  const [offsets, setOffsets] = useState<number[]>(() =>
    makeRange(-CHUNK, CHUNK),
  );
  const offsetsRef = useRef(offsets);
  useEffect(() => {
    offsetsRef.current = offsets;
  }, [offsets]);

  const zeroIndexRef = useRef<number>(CHUNK);
  const listRef = useRef<FlatList<number>>(null);

  const [visibleMonth, setVisibleMonth] = useState<Dayjs>(anchor);
  const [selected, setSelected] = useState<Dayjs | null>(
    dayjs(initialDate ?? anchor).startOf('day'),
  );

  const labels =
    weekdayLabels ??
    (weekStartsOn === 1
      ? defaultWeekdayLabelsKoMonStart
      : defaultWeekdayLabelsKoSunStart);

  const monthFromOffset = useCallback(
    (offset: number) => anchor.add(offset, 'month'),
    [anchor],
  );

  const buildMonthMatrix = useCallback(
    (month: Dayjs): Cell[] => {
      const start = month.startOf('month');
      const firstWeekday = start.day();
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
    ({ item: offset }: ListRenderItemInfo<number>) => {
      const month = monthFromOffset(offset);
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
      monthFromOffset,
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

  // ✅ 확장 중복 방지 플래그
  const extendingRef = useRef(false);

  // 가시 아이템 변화 → visibleMonth 반영 + 무한 확장
  const onViewableItemsChanged = useRef(
    (info: {
      viewableItems: Array<ViewToken<number>>;
      changed: Array<ViewToken<number>>;
    }) => {
      const token = info.viewableItems[0];
      if (!token) return;

      const i = token.index; // number | null
      const off = token.item; // number | null
      if (i == null || off == null) return;

      const m = monthFromOffset(off);
      setVisibleMonth(m);
      onMonthChange?.(m);

      const len = offsetsRef.current.length;
      if (extendingRef.current) return;

      // 앞쪽 확장
      if (i <= PRELOAD_THRESHOLD) {
        extendingRef.current = true;
        setOffsets(prev => {
          const min = prev[0];
          const prepend = makeRange(min - CHUNK, min - 1);
          const next = [...prepend, ...prev];

          // 인덱스 보정 (프리펜드로 밀린 만큼)
          const nextIndex = i + CHUNK;
          zeroIndexRef.current += CHUNK;

          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({
              index: nextIndex,
              animated: false,
            });
            extendingRef.current = false;
          });

          return next;
        });
        return;
      }

      // 뒤쪽 확장
      if (i >= len - 1 - PRELOAD_THRESHOLD) {
        extendingRef.current = true;
        setOffsets(prev => {
          const max = prev[prev.length - 1];
          const append = makeRange(max + 1, max + CHUNK);
          const next = [...prev, ...append];
          requestAnimationFrame(() => {
            extendingRef.current = false;
          });
          return next;
        });
      }
    },
  ).current;

  // ── 헤더에서 쓸 제어 메서드 제공 ─────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    goPrevMonth() {
      const currentOffset = Math.round(visibleMonth.diff(anchor, 'month'));
      const idx = offsetsRef.current.indexOf(currentOffset);
      if (idx > 0)
        listRef.current?.scrollToIndex({ index: idx - 1, animated: true });
    },
    goNextMonth() {
      const currentOffset = Math.round(visibleMonth.diff(anchor, 'month'));
      const idx = offsetsRef.current.indexOf(currentOffset);
      if (idx !== -1)
        listRef.current?.scrollToIndex({ index: idx + 1, animated: true });
    },
    scrollToMonthOffset(targetOffset: number) {
      const idx = offsetsRef.current.indexOf(targetOffset);
      if (idx !== -1)
        listRef.current?.scrollToIndex({ index: idx, animated: true });
    },
  }));
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {visibleMonth.format('YYYY년 MM월')}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={offsets}
        horizontal
        pagingEnabled
        keyExtractor={o => String(o)}
        renderItem={renderItem}
        initialScrollIndex={zeroIndexRef.current}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 51 }}
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

  monthContainer: {
    paddingHorizontal: SIDE_PAD,
    paddingBottom: 12,
  },
  monthTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 8,
  },

  weekHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekday: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  weekend: { color: '#c03' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    // backgroundColor: 'red', // 필요 시 확인용
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
