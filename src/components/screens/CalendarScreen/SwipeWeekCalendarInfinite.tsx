// SwipeWeekInfinite.tsx
import React, {
  useMemo,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItemInfo,
  ViewToken,
} from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import isTodayPlugin from 'dayjs/plugin/isToday';
import { SIDE_PAD } from '@/constants/layout';
dayjs.extend(isTodayPlugin);

export type SwipeWeekHandle = {
  goToWeek: (
    dateLike: Dayjs | string | Date,
    opts?: { select?: boolean; animated?: boolean },
  ) => void;
  goPrevWeek: () => void;
  goNextWeek: () => void;
};

type Props = {
  selected: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  onWeekChange?: (weekStart: Dayjs) => void;
  weekStartsOn?: 0 | 1; // 0=일 1=월

  // 레이아웃 관련
  gridWidth: number;
  cellWidth: number;
  width: number;
};

const WEEK_WINDOW = 120;
const WEEK_CENTER = Math.floor(WEEK_WINDOW / 2);
const WEEK_SHIFT = WEEK_CENTER;
const PRELOAD = 4;

const startOfWeek = (d: Dayjs, weekStartsOn: 0 | 1 = 0) => {
  const w = d.day(); // 0..6
  const off = weekStartsOn === 1 ? (w + 6) % 7 : w;
  return d.startOf('day').subtract(off, 'day');
};

const SwipeWeekInfinite = forwardRef<SwipeWeekHandle, Props>(function C(
  {
    selected,
    onSelectDate,
    onWeekChange,
    weekStartsOn = 0,
    gridWidth,
    cellWidth,
    width,
  },
  ref,
) {
  const data = useMemo(
    () => Array.from({ length: WEEK_WINDOW }, (_, i) => i),
    [],
  );

  // 기준/상태 refs
  const anchorRef = useRef(startOfWeek(selected ?? dayjs(), weekStartsOn)); // 최초 주 시작
  const baseRef = useRef(0); // 앵커로부터 몇 주 이동했는지의 베이스(센터 보정용)
  const listRef = useRef<FlatList<number>>(null);
  const teleportingRef = useRef(false);
  const isAnimatingRef = useRef(false); // 스크롤 애니메이션 중 가드
  const lastIndexRef = useRef<number>(WEEK_CENTER); // 현재 보이는 인덱스 추적
  const isDraggingRef = useRef(false);
  const isMomentumRef = useRef(false);

  const weekFromIndex = useCallback((index: number) => {
    const eff = baseRef.current + (index - WEEK_CENTER);
    return anchorRef.current.add(eff, 'week'); // 주 시작일
  }, []);

  const renderItem = useCallback(
    ({ index }: ListRenderItemInfo<number>) => {
      const wkStart = weekFromIndex(index);
      const days = Array.from({ length: 7 }, (_, i) => wkStart.add(i, 'day'));

      return (
        <View style={[styles.page, { width }]}>
          <View style={[styles.grid, { width: gridWidth }]}>
            {days.map(d => {
              const key = d.format('YYYY-MM-DD');
              const isSel = d.isSame(selected, 'day');
              const isToday = d.isToday();
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.cell,
                    { width: cellWidth, height: cellWidth },
                    isSel && styles.cellSelected,
                    isToday && styles.cellToday,
                  ]}
                  onPress={() => onSelectDate(d.startOf('day'))}
                >
                  <Text
                    style={[styles.cellText, isSel && styles.cellTextSelected]}
                  >
                    {d.date()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, onSelectDate, weekFromIndex],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  // 현재 보이는 주(인덱스) 감시 + 무한루프용 텔레포트
  const onViewable = useRef(
    (info: { viewableItems: Array<ViewToken<number>> }) => {
      if (teleportingRef.current) return;
      const i = info.viewableItems?.[0]?.index ?? null;
      if (i == null) return;

      lastIndexRef.current = i;
      onWeekChange?.(weekFromIndex(i));
      // ⛔️ 여기서는 재베이스(teleport) 수행 금지
    },
  ).current;

  // 현재 보이는 주 시작일 계산 유틸
  const currentVisibleWeekStart = useCallback(() => {
    return weekFromIndex(lastIndexRef.current);
  }, [weekFromIndex]);

  // 공통 이동 헬퍼(±n주)
  const goByWeeks = useCallback(
    (step: number) => {
      if (teleportingRef.current || isAnimatingRef.current) return;

      const nextIndex = lastIndexRef.current + step;

      // 윈도우 안 → 애니메이션 스크롤
      if (nextIndex >= 0 && nextIndex < WEEK_WINDOW) {
        isAnimatingRef.current = true;
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        lastIndexRef.current = nextIndex;
        onWeekChange?.(weekFromIndex(nextIndex));
        // 간단 락 해제 (가능하면 onMomentumScrollEnd에서 해제하도록 개선 가능)
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 160);
        return;
      }

      // 경계 밖 → 베이스 재정렬 후 중앙으로 텔레포트
      teleportingRef.current = true;
      const cur = currentVisibleWeekStart();
      const target = cur.add(step, 'week');
      // anchor 기준 오프셋을 재정렬: CENTER가 target이 되도록
      baseRef.current = target.diff(anchorRef.current, 'week');

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: WEEK_CENTER, animated: false });
        lastIndexRef.current = WEEK_CENTER;
        onWeekChange?.(weekFromIndex(WEEK_CENTER));
        teleportingRef.current = false;
      });
    },
    [currentVisibleWeekStart, onWeekChange, weekFromIndex],
  );

  const maybeRebaseToCenter = useCallback(() => {
    const i = lastIndexRef.current;
    if (teleportingRef.current) return;

    const atHead = i <= PRELOAD;
    const atTail = i >= WEEK_WINDOW - 1 - PRELOAD;
    if (!atHead && !atTail) return;

    teleportingRef.current = true;
    baseRef.current += atTail ? WEEK_SHIFT : -WEEK_SHIFT;
    const next = atTail ? i - WEEK_SHIFT : i + WEEK_SHIFT;

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: next, animated: false });
      lastIndexRef.current = next;
      onWeekChange?.(weekFromIndex(next));
      teleportingRef.current = false;
    });
  }, [onWeekChange, weekFromIndex]);

  useImperativeHandle(ref, () => ({
    goToWeek(dateLike, opts) {
      if (teleportingRef.current || isAnimatingRef.current) return;

      const d = dayjs(dateLike);
      const target = startOfWeek(d, weekStartsOn); // 목표 주 시작
      const diff = target.diff(anchorRef.current, 'week');
      const idx = diff - baseRef.current + WEEK_CENTER;
      const animated = opts?.animated ?? true;

      const finalize = () => {
        if (opts?.select !== false) onSelectDate(d.startOf('day'));
      };

      if (idx >= 0 && idx < WEEK_WINDOW) {
        if (animated) isAnimatingRef.current = true;
        listRef.current?.scrollToIndex({ index: idx, animated });
        lastIndexRef.current = idx;
        onWeekChange?.(target);
        if (animated) {
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 160);
        }
        finalize();
      } else {
        teleportingRef.current = true;
        baseRef.current = diff;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({
            index: WEEK_CENTER,
            animated: false,
          });
          lastIndexRef.current = WEEK_CENTER;
          onWeekChange?.(
            startOfWeek(
              anchorRef.current.add(baseRef.current, 'week'),
              weekStartsOn,
            ),
          );
          teleportingRef.current = false;
          finalize();
        });
      }
    },

    goPrevWeek() {
      if (teleportingRef.current) return;
      goByWeeks(-1);
    },

    goNextWeek() {
      if (teleportingRef.current) return;
      goByWeeks(1);
    },
  }));

  return (
    <FlatList
      ref={listRef}
      data={data}
      horizontal
      pagingEnabled
      keyExtractor={i => String(i)}
      renderItem={renderItem}
      initialScrollIndex={WEEK_CENTER}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewable}
      viewabilityConfig={{ itemVisiblePercentThreshold: 51 }}
      showsHorizontalScrollIndicator={false}
      windowSize={3}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      removeClippedSubviews
      onMomentumScrollEnd={() => {
        // NEW
        isMomentumRef.current = false;
        isAnimatingRef.current = false; // 버튼 이동 락 해제
        maybeRebaseToCenter(); // ✅ 스크롤 종료 시에만 재베이스
      }}
    />
  );
});

export default SwipeWeekInfinite;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: SIDE_PAD,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  cellToday: {
    borderWidth: 1,
    borderColor: '#888',
  },
  cellSelected: {
    backgroundColor: '#222',
  },
  cellText: {
    fontSize: 14,
  },
  cellTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});
