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
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import isTodayPlugin from 'dayjs/plugin/isToday';
dayjs.extend(isTodayPlugin);

export type SwipeWeekHandle = {
  goToWeek: (
    dateLike: Dayjs | string | Date,
    opts?: { select?: boolean; animated?: boolean },
  ) => void;
};

type Props = {
  selected: Dayjs;
  onSelectDate: (d: Dayjs) => void;
  onWeekChange?: (weekStart: Dayjs) => void;
  weekStartsOn?: 0 | 1; // 0=일 1=월
};

const WEEK_WINDOW = 120;
const WEEK_CENTER = Math.floor(WEEK_WINDOW / 2);
const WEEK_SHIFT = WEEK_CENTER;
const PRELOAD = 4;

const SIDE_PAD = 12;
const labels = ['일', '월', '화', '수', '목', '금', '토'];

const startOfWeek = (d: Dayjs, weekStartsOn: 0 | 1 = 0) => {
  const w = d.day(); // 0..6
  const off = weekStartsOn === 1 ? (w + 6) % 7 : w;
  return d.startOf('day').subtract(off, 'day');
};

const SwipeWeekInfinite = forwardRef<SwipeWeekHandle, Props>(function C(
  { selected, onSelectDate, onWeekChange, weekStartsOn = 0 },
  ref,
) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.floor(width - SIDE_PAD * 2);
  const cellWidth = Math.floor(contentWidth / 7);
  const gridWidth = cellWidth * 7;

  const data = useMemo(
    () => Array.from({ length: WEEK_WINDOW }, (_, i) => i),
    [],
  );
  const anchorRef = useRef(startOfWeek(selected ?? dayjs(), weekStartsOn)); // 최초 주 시작
  const baseRef = useRef(0);
  const listRef = useRef<FlatList<number>>(null);

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
          <Text style={styles.title}>{wkStart.format('YYYY년 MM월')}</Text>
          <View style={[styles.weekHeader, { width: gridWidth }]}>
            {labels.map((l, i) => (
              <Text
                key={i}
                style={[
                  styles.weekday,
                  { width: cellWidth },
                  (i === 0 || i === 6) && styles.weekend,
                ]}
              >
                {l}
              </Text>
            ))}
          </View>
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
                    { width: cellWidth },
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
    [cellWidth, gridWidth, selected, onSelectDate, weekFromIndex, width],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width],
  );

  const teleportingRef = useRef(false);
  const onViewable = useRef(
    (info: { viewableItems: Array<ViewToken<number>> }) => {
      if (teleportingRef.current) return;
      const i = info.viewableItems?.[0]?.index ?? null;
      if (i == null) return;

      const wk = weekFromIndex(i);
      onWeekChange?.(wk);

      if (i <= PRELOAD) {
        teleportingRef.current = true;
        baseRef.current -= WEEK_SHIFT;
        const next = i + WEEK_SHIFT;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: next, animated: false });
          onWeekChange?.(weekFromIndex(next));
          teleportingRef.current = false;
        });
      } else if (i >= WEEK_WINDOW - 1 - PRELOAD) {
        teleportingRef.current = true;
        baseRef.current += WEEK_SHIFT;
        const next = i - WEEK_SHIFT;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: next, animated: false });
          onWeekChange?.(weekFromIndex(next));
          teleportingRef.current = false;
        });
      }
    },
  ).current;

  useImperativeHandle(ref, () => ({
    goToWeek(dateLike, opts) {
      const d = dayjs(dateLike);
      const target = startOfWeek(d, weekStartsOn); // 목표 주 시작
      const diff = target.diff(anchorRef.current, 'week');
      const idx = diff - baseRef.current + WEEK_CENTER;
      const animated = opts?.animated ?? true;

      const finalize = () => {
        if (opts?.select !== false) onSelectDate(d.startOf('day'));
      };

      if (idx >= 0 && idx < WEEK_WINDOW) {
        listRef.current?.scrollToIndex({ index: idx, animated });
        onWeekChange?.(target);
        finalize();
      } else {
        teleportingRef.current = true;
        baseRef.current = diff;
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({
            index: WEEK_CENTER,
            animated: false,
          });
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
    />
  );
});

export default SwipeWeekInfinite;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: SIDE_PAD,
    paddingVertical: 16,
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  weekend: {
    color: '#c03',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
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
