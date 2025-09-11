import React, {
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
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
  scrollToMonthOffset: (offset: number) => void;
  goToday: (select?: boolean) => void;
  goToDate: (
    dateLike: Dayjs | string | Date,
    opts?: { select?: boolean; animated?: boolean },
  ) => void;
};

type Cell = { date: Dayjs; inMonth: boolean };

// Ring buffer params
const WINDOW = 100;
const SHIFT = WINDOW / 2;
const CENTER = Math.floor(WINDOW / 2);
const PRELOAD_THRESHOLD = 4;

// Layout
const SIDE_PAD = 12;
const DATA = Array.from({ length: WINDOW }, (_, i) => i);

const SwipeMonthCalendarInfinite = forwardRef<SwipeMonthCalendarHandle, Props>(
  (
    { selected, onMonthChange, onSelectDate, gridWidth, cellWidth, width },
    ref,
  ) => {
    const anchorRef = useRef(dayjs(selected ?? new Date()).startOf('month'));
    const anchor = anchorRef.current;

    const lastIndexRef = useRef<number>(CENTER);
    const baseOffsetRef = useRef(0);
    const listRef = useRef<FlatList<number>>(null);
    const teleportingRef = useRef(false);

    const [scrollLocked, setScrollLocked] = useState(false);
    const lockScroll = () => setScrollLocked(true);
    const unlockScroll = () => setScrollLocked(false);

    // Navigation cooldown
    const NAV_COOLDOWN = 280;
    const lastNavAtRef = useRef(0);
    const inCooldown = () => {
      const now = Date.now();
      if (now - lastNavAtRef.current < NAV_COOLDOWN) return true;
      lastNavAtRef.current = now;
      return false;
    };

    const offsetFromIndex = useCallback(
      (index: number) => baseOffsetRef.current + (index - CENTER),
      [],
    );

    const monthFromIndex = useCallback(
      (index: number) => anchor.add(offsetFromIndex(index), 'month'),
      [anchor, offsetFromIndex],
    );

    const buildMonthMatrix = useCallback((month: Dayjs): Cell[] => {
      const start = month.startOf('month');
      const firstWeekday = start.day();
      const gridStart = start.subtract(firstWeekday, 'day');

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
                    onPress={() => onSelectDate?.(cell.date.startOf('day'))}
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

    const onViewableItemsChanged = useRef(
      (info: { viewableItems: Array<ViewToken<number>> }) => {
        if (teleportingRef.current) return;
        const i = info.viewableItems?.[0]?.index ?? null;
        if (i == null) return;

        lastIndexRef.current = i;
        onMonthChange?.(monthFromIndex(i));
      },
    ).current;

    const maybeRebaseToCenter = useCallback(() => {
      const i = lastIndexRef.current;
      if (teleportingRef.current) return;

      const atHead = i <= PRELOAD_THRESHOLD;
      const atTail = i >= WINDOW - 1 - PRELOAD_THRESHOLD;
      if (!atHead && !atTail) return;

      teleportingRef.current = true;
      lockScroll();
      baseOffsetRef.current += atTail ? SHIFT : -SHIFT;
      const nextIndex = atTail ? i - SHIFT : i + SHIFT;

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
        lastIndexRef.current = nextIndex;
        onMonthChange?.(monthFromIndex(nextIndex));
        teleportingRef.current = false;
        unlockScroll();
      });
    }, [monthFromIndex, onMonthChange]);

    useImperativeHandle(ref, () => ({
      goPrevMonth() {
        if (teleportingRef.current || inCooldown()) return;
        const idx = Math.max(0, lastIndexRef.current - 1);
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      },
      goNextMonth() {
        if (teleportingRef.current || inCooldown()) return;
        const idx = Math.min(WINDOW - 1, lastIndexRef.current + 1);
        listRef.current?.scrollToIndex({ index: idx, animated: true });
      },
      scrollToMonthOffset(targetOffset: number) {
        if (teleportingRef.current || inCooldown()) return;
        const idx = targetOffset - baseOffsetRef.current + CENTER;
        if (idx >= 0 && idx < WINDOW) {
          listRef.current?.scrollToIndex({ index: idx, animated: true });
        } else {
          teleportingRef.current = true;
          lockScroll();
          baseOffsetRef.current = targetOffset;
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index: CENTER, animated: false });
            onMonthChange?.(monthFromIndex(CENTER));
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
            unlockScroll();
          });
        }
      },
      goToday(select = true) {
        if (teleportingRef.current || inCooldown()) return;
        const todayStart = dayjs().startOf('day');
        const todayMonth = todayStart.startOf('month');
        const targetOffset = todayMonth.diff(anchorRef.current, 'month');
        const idx = targetOffset - baseOffsetRef.current + CENTER;

        if (idx >= 0 && idx < WINDOW) {
          listRef.current?.scrollToIndex({ index: idx, animated: true });
        } else {
          teleportingRef.current = true;
          lockScroll();
          baseOffsetRef.current = targetOffset;
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index: CENTER, animated: false });
            onMonthChange?.(
              anchorRef.current.add(baseOffsetRef.current, 'month'),
            );
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
            unlockScroll();
          });
        }
        if (select && onSelectDate) onSelectDate(todayStart);
      },
      goToDate(dateLike, opts) {
        if (teleportingRef.current || inCooldown()) return;
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
          lockScroll();
          baseOffsetRef.current = targetOffset;
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index: CENTER, animated: false });
            onMonthChange?.(monthFromIndex(CENTER));
            lastIndexRef.current = CENTER;
            teleportingRef.current = false;
            unlockScroll();
            finalize();
          });
        }
      },
    }));

    return (
      <FlatList
        scrollEnabled={!scrollLocked}
        ref={listRef}
        data={DATA}
        horizontal
        pagingEnabled
        keyExtractor={i => String(i)}
        renderItem={renderItem}
        initialScrollIndex={CENTER}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 95 }}
        showsHorizontalScrollIndicator={false}
        windowSize={3}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews
        onMomentumScrollEnd={() => {
          unlockScroll();
          lastNavAtRef.current = Date.now();
          maybeRebaseToCenter();
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
