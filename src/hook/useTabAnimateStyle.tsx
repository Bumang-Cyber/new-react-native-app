import {
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  SharedValue,
} from 'react-native-reanimated';

// idx: 0(diet) | 1(workout) | 2(body)
const useTabTextStyle = (idx: number, tabPos: SharedValue<number>) =>
  useAnimatedStyle(() => {
    // 현재 스크롤 위치(tabPos)와 이 탭(idx)의 거리(0이면 정중앙 활성이며 1 이상 멀어짐)
    const dist = Math.abs(tabPos.value - idx);
    // 0~1로 클램프된 활성도(0=비활성, 1=완전 활성)
    const active = 1 - Math.min(1, dist);

    return {
      // 색상은 실시간 블렌딩
      color: interpolateColor(active, [0, 1], ['#111111', '#FFFFFF']),
      // 약간의 강조(선택)
      opacity: interpolate(active, [0, 1], [0.7, 1]),
      transform: [{ scale: interpolate(active, [0, 1], [0.98, 1]) }],
    };
  }, [tabPos]);

export default useTabTextStyle;
