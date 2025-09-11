import React, {
  useCallback,
  useRef,
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
import isoWeek from 'dayjs/plugin/isoWeek';
import isTodayPlugin from 'dayjs/plugin/isToday';
dayjs.extend(isoWeek);
dayjs.extend(isTodayPlugin);

type Props = {
  onMonthChange?: (m: Dayjs) => void;
  onSelectDate?: (d: Dayjs) => void;

  selected: Dayjs;
  gridWidth: number;
  cellWidth: number;
  width: number;
};

export type SwipeMonthCalendarHandle = {
  goPrevMonth: () => void;
  goNextMonth: () => void;
  scrollToMonthOffset: (offset: number) => void; // anchor 기준 offset로 스크롤
  goToday: (select?: boolean) => void;
  goToDate: (
    dateLike: Dayjs | string | Date,
    opts?: { select?: boolean; animated?: boolean },
  ) => void;
};

type Cell = { date: Dayjs; inMonth: boolean };

// ── 링 버퍼 파라미터 ──────────────────────────────────────────────
const WINDOW = 60; // 고정 페이지 수 (예: 4년)
const SHIFT = WINDOW / 2; // 워프 이동 칸수 (보통 WINDOW/2)
const CENTER = Math.floor(WINDOW / 2);
const PRELOAD_THRESHOLD = 4; // 가장자리 감지 임계치

// ── 레이아웃 ─────────────────────────────────────────────────────
const SIDE_PAD = 12; // styles.page.paddingHorizontal 과 동일해야 함
const DATA = Array.from({ length: WINDOW }, (_, i) => i);

const SwipeMonthCalendarInfinite = forwardRef<SwipeMonthCalendarHandle, Props>(
  (
    {
      selected,
      onMonthChange,
      onSelectDate,

      gridWidth,
      cellWidth,
      width,
    },
    ref,
  ) => {
    // anchor는 최초 1회 고정
    const anchorRef = useRef(dayjs(selected ?? new Date()).startOf('month'));
    const anchor = anchorRef.current;

    // 현재 보이는 인덱스/월
    const lastIndexRef = useRef<number>(CENTER);

    // 기준 오프셋(월) 누적 값
    const baseOffsetRef = useRef(0);
    // index -> anchor로부터의 실제 month offset

    // 기준월에서
    const offsetFromIndex = useCallback(
      (index: number) => baseOffsetRef.current + (index - CENTER),
      [],
    );
    // 실제 month 계산
    const monthFromIndex = useCallback(
      (index: number) => anchor.add(offsetFromIndex(index), 'month'),
      [anchor, offsetFromIndex],
    );

    // 42칸(6주) '일' 그리드 생성
    const buildMonthMatrix = useCallback((month: Dayjs): Cell[] => {
      const start = month.startOf('month');
      const firstWeekday = start.day(); // 0(일)~6(토)
      const offset = firstWeekday;
      const gridStart = start.subtract(offset, 'day');

      const out: Cell[] = [];
      for (let i = 0; i < 42; i++) {
        const d = gridStart.add(i, 'day');
        out.push({ date: d, inMonth: d.isSame(month, 'month') });
      }
      return out;
    }, []);

    const renderItem = useCallback(
      ({ index }: ListRenderItemInfo<number>) => {
        const month = monthFromIndex(index);
        const cells = buildMonthMatrix(month);

        return (
          <View style={[styles.page, { width }]}>
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
                      { width: cellWidth, height: cellWidth },
                      isSelected && styles.cellSelected,
                      isToday && styles.cellToday,
                    ]}
                    onPress={() => {
                      const d = cell.date.startOf('day');
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
        monthFromIndex,
        selected,
        width,
        gridWidth,
        cellWidth,
        onSelectDate,
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

    // 헤더 제어용 메서드
    const listRef = useRef<FlatList<number>>(null);
    // 워프 중 중복 처리를 막기 위한 플래그
    const teleportingRef = useRef(false);
    const isAnimatingRef = useRef(false); // NEW: 프로그램 스크롤 중 락
    const isDraggingRef = useRef(false); // NEW: 사용자 드래그 중
    const isMomentumRef = useRef(false); // NEW: 모멘텀 진행 중

    const onViewableItemsChanged = useRef(
      (info: {
        viewableItems: Array<ViewToken<number>>;
        changed: Array<ViewToken<number>>;
      }) => {
        if (teleportingRef.current) return;

        const i = info.viewableItems?.[0]?.index ?? null;
        if (i == null) return;

        lastIndexRef.current = i;

        const month = monthFromIndex(i);
        onMonthChange?.(month);

        // ⛔️ 여기서는 재베이스(teleport) 하지 않음
      },
    ).current;

    const maybeRebaseToCenter = useCallback(() => {
      const i = lastIndexRef.current;
      if (teleportingRef.current) return;

      const atHead = i <= PRELOAD_THRESHOLD;
      const atTail = i >= WINDOW - 1 - PRELOAD_THRESHOLD;
      if (!atHead && !atTail) return;

      teleportingRef.current = true;
      baseOffsetRef.current += atTail ? SHIFT : -SHIFT;
      const nextIndex = atTail ? i - SHIFT : i + SHIFT;

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
        lastIndexRef.current = nextIndex;
        onMonthChange?.(monthFromIndex(nextIndex));
        teleportingRef.current = false;
      });
    }, [monthFromIndex, onMonthChange]);

    useImperativeHandle(ref, () => ({
      goPrevMonth() {
        if (teleportingRef.current) return;
        const idx = Math.max(0, lastIndexRef.current - 1);
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      },
      goNextMonth() {
        if (teleportingRef.current) return;
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
            onMonthChange?.(mm);
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
          });
        }
      },
      goToday(select = true) {
        const todayStart = dayjs().startOf('day');
        const todayMonth = todayStart.startOf('month');

        // anchor로부터 '오늘의 달'까지 몇 개월 차이인지
        const targetOffset = todayMonth.diff(anchorRef.current, 'month');

        // 내부 jump 로직 (scrollToMonthOffset과 동일한 원리)
        const idx = targetOffset - baseOffsetRef.current + CENTER;
        if (idx >= 0 && idx < WINDOW) {
          // 윈도우 안이면 그냥 스크롤
          listRef.current?.scrollToIndex({ index: idx, animated: true });
        } else {
          // 윈도우 밖이면 기준을 재조정 후 중앙으로 텔레포트
          teleportingRef.current = true;
          baseOffsetRef.current = targetOffset;
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index: CENTER, animated: false });
            const mm = anchorRef.current.add(
              baseOffsetRef.current + (CENTER - CENTER),
              'month',
            );
            onMonthChange?.(mm);
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
          });
        }

        // 선택까지 맞추고 싶으면
        if (select && onSelectDate) onSelectDate(todayStart);
      },
      goToDate(dateLike, opts) {
        const d = dayjs(dateLike);
        const targetMonth = d.startOf('month');
        const targetOffset = targetMonth.diff(anchorRef.current, 'month');

        const idx = targetOffset - baseOffsetRef.current + CENTER;
        const animated = opts?.animated ?? true;

        const finalize = () => {
          if (opts?.select !== false && onSelectDate)
            onSelectDate(d.startOf('day'));
        };

        if (idx >= 0 && idx < WINDOW) {
          listRef.current?.scrollToIndex({ index: idx, animated });
          finalize();
        } else {
          teleportingRef.current = true;
          baseOffsetRef.current = targetOffset;
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index: CENTER, animated: false });
            const mm = monthFromIndex(CENTER);
            onMonthChange?.(mm);
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
            finalize();
          });
        }
      },
    }));

    return (
      <FlatList
        ref={listRef}
        data={DATA}
        horizontal
        pagingEnabled
        keyExtractor={i => String(i)}
        renderItem={renderItem}
        initialScrollIndex={CENTER} // 시작 인덱스
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged} // 보이는 아이템 바뀔때마다 호출 (onChange)
        viewabilityConfig={{ itemVisiblePercentThreshold: 51 }} // 51퍼센트 이상 보여야 '보임'으로 간주.
        showsHorizontalScrollIndicator={false} // 가로 스크롤바 가림
        windowSize={3} // windowing 얼마나 하고 있을지
        initialNumToRender={3} // 초기에 몇 개 렌더(빠른 첫 페인트)
        maxToRenderPerBatch={3}
        removeClippedSubviews
        onScrollBeginDrag={() => {
          isDraggingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isDraggingRef.current = false;
        }}
        onMomentumScrollBegin={() => {
          isMomentumRef.current = true;
        }}
        onMomentumScrollEnd={() => {
          isMomentumRef.current = false;
          isAnimatingRef.current = false; // 프로그램 스크롤 락 해제
          maybeRebaseToCenter(); // ✅ 종료 후에만 재베이스
        }}
      />
    );
  },
);
SwipeMonthCalendarInfinite.displayName = 'SwipeMonthCalendarInfinite';
export default SwipeMonthCalendarInfinite;

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
    color: 'white',
    fontWeight: '700',
  },
  dimmedText: {
    color: '#aaa',
  },
});
