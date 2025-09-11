import React, {
  useMemo,
  useRef,
  useCallback,
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
  weekStartsOn?: 0 | 1;
  gridWidth: number;
  cellWidth: number;
  width: number;
};

const WEEK_WINDOW = 120;
const WEEK_CENTER = Math.floor(WEEK_WINDOW / 2);
const WEEK_SHIFT = WEEK_CENTER;
const PRELOAD = 4;

const startOfWeek = (d: Dayjs, weekStartsOn: 0 | 1 = 0) => {
  const w = d.day();
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

  const anchorRef = useRef(startOfWeek(selected ?? dayjs(), weekStartsOn));
  const baseRef = useRef(0);
  const listRef = useRef<FlatList<number>>(null);
  const teleportingRef = useRef(false);
  const lastIndexRef = useRef<number>(WEEK_CENTER);

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

  const weekFromIndex = useCallback((index: number) => {
    const eff = baseRef.current + (index - WEEK_CENTER);
    return anchorRef.current.add(eff, 'week');
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
    [selected, onSelectDate, weekFromIndex, gridWidth, cellWidth, width],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const onViewable = useRef(
    (info: { viewableItems: Array<ViewToken<number>> }) => {
      if (teleportingRef.current) return;
      const i = info.viewableItems?.[0]?.index ?? null;
      if (i == null) return;
      lastIndexRef.current = i;
      onWeekChange?.(weekFromIndex(i));
    },
  ).current;

  const goByWeeks = useCallback(
    (step: number) => {
      if (teleportingRef.current || inCooldown()) return;

      const nextIndex = lastIndexRef.current + step;
      if (nextIndex >= 0 && nextIndex < WEEK_WINDOW) {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        lastIndexRef.current = nextIndex;
        onWeekChange?.(weekFromIndex(nextIndex));
        return;
      }

      teleportingRef.current = true;
      lockScroll();
      const cur = weekFromIndex(lastIndexRef.current);
      const target = cur.add(step, 'week');
      baseRef.current = target.diff(anchorRef.current, 'week');

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: WEEK_CENTER, animated: false });
        lastIndexRef.current = WEEK_CENTER;
        onWeekChange?.(weekFromIndex(WEEK_CENTER));
        teleportingRef.current = false;
        unlockScroll();
      });
    },
    [onWeekChange, weekFromIndex],
  );

  const maybeRebaseToCenter = useCallback(() => {
    const i = lastIndexRef.current;
    if (teleportingRef.current) return;

    const atHead = i <= PRELOAD;
    const atTail = i >= WEEK_WINDOW - 1 - PRELOAD;
    if (!atHead && !atTail) return;

    teleportingRef.current = true;
    lockScroll();
    baseRef.current += atTail ? WEEK_SHIFT : -WEEK_SHIFT;
    const next = atTail ? i - WEEK_SHIFT : i + WEEK_SHIFT;

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: next, animated: false });
      lastIndexRef.current = next;
      onWeekChange?.(weekFromIndex(next));
      teleportingRef.current = false;
      unlockScroll();
    });
  }, [onWeekChange, weekFromIndex]);

  useImperativeHandle(ref, () => ({
    goToWeek(dateLike, opts) {
      if (teleportingRef.current || inCooldown()) return;

      const d = dayjs(dateLike);
      const target = startOfWeek(d, weekStartsOn);
      const diff = target.diff(anchorRef.current, 'week');
      const idx = diff - baseRef.current + WEEK_CENTER;
      const animated = opts?.animated ?? true;

      const finalize = () => {
        if (opts?.select !== false) onSelectDate(d.startOf('day'));
      };

      if (idx >= 0 && idx < WEEK_WINDOW) {
        listRef.current?.scrollToIndex({ index: idx, animated });
        lastIndexRef.current = idx;
        onWeekChange?.(target);
        finalize();
      } else {
        teleportingRef.current = true;
        lockScroll();
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
          unlockScroll();
          finalize();
        });
      }
    },

    goPrevWeek() {
      if (teleportingRef.current || inCooldown()) return;
      goByWeeks(-1);
    },

    goNextWeek() {
      if (teleportingRef.current || inCooldown()) return;
      goByWeeks(1);
    },
  }));

  return (
    <FlatList
      scrollEnabled={!scrollLocked}
      ref={listRef}
      data={data}
      horizontal
      pagingEnabled
      keyExtractor={i => String(i)}
      renderItem={renderItem}
      initialScrollIndex={WEEK_CENTER}
      getItemLayout={getItemLayout}
      onViewableItemsChanged={onViewable}
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
