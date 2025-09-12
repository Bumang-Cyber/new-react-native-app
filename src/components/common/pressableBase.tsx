// PressableBase.tsx
import React, { forwardRef, useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  ViewStyle,
  View,
} from 'react-native';

type Props = Omit<PressableProps, 'style' | 'onPress'> & {
  children?: React.ReactNode;
  /** pressed일 때 투명도 (0~1). 기본 0.7 */
  pressOpacity?: number;
  /** pressed일 때 scale. 기본 0.98 */
  pressScale?: number;
  /** 안드로이드 ripple 색상 (#RRGGBBAA 권장) */
  androidRippleColor?: string;
  /** 둥근 버튼이면 radius를 주면 ripple도 맞춰짐 */
  borderRadius?: number;
  /** 외곽 여유 터치 영역. 기본 {top/bottom/left/right: 8} */
  hitSlopSize?: number;
  /** 중복 탭 방지(ms). 기본 0 = 비활성 */
  debounceMs?: number;
  /** 진동/햅틱 사용 (Expo Haptics 등 외부에서 콜백 전달) */
  haptic?: () => void;
  /** style 배열/객체 모두 받기 */
  style?: ViewStyle | ViewStyle[];
  /** onPress (debounce/haptic 래핑됨) */
  onPress?: (e: GestureResponderEvent) => void;
  /** 로딩일 때 onPress 막고 pressed 스타일 비활성 */
  loading?: boolean;
};

export const PressableBase = forwardRef<View, Props>(function PressableBase(
  {
    children,
    pressOpacity = 0.7,
    pressScale = 0.98,
    androidRippleColor = '#00000022',
    borderRadius = 12,
    hitSlopSize = 8,
    debounceMs = 0,
    haptic,
    disabled,
    onPress,
    style,
    loading,
    ...rest
  },
  ref,
) {
  const lastPressTsRef = useRef(0);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (disabled || loading) return;

      const now = Date.now();
      if (debounceMs > 0 && now - lastPressTsRef.current < debounceMs) return;
      lastPressTsRef.current = now;

      // 선택적 햅틱
      try {
        haptic?.();
      } catch {}

      onPress?.(e);
    },
    [disabled, loading, debounceMs, haptic, onPress],
  );

  const rippleConfig = useMemo(
    () =>
      Platform.OS === 'android'
        ? {
            android_ripple: {
              color: androidRippleColor,
              borderless: false,
              radius: borderRadius
                ? Math.max(borderRadius * 1.2, 18)
                : undefined,
            } as PressableProps['android_ripple'],
          }
        : undefined,
    [androidRippleColor, borderRadius],
  );

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      hitSlop={{
        top: hitSlopSize,
        bottom: hitSlopSize,
        left: hitSlopSize,
        right: hitSlopSize,
      }}
      disabled={disabled || loading}
      {...rippleConfig}
      style={({ pressed }) => {
        const pressedActive = pressed && !disabled && !loading;
        const base: ViewStyle = {
          borderRadius,
        };

        const pressedStyle: ViewStyle = pressedActive
          ? { opacity: pressOpacity, transform: [{ scale: pressScale }] }
          : ({} as ViewStyle);

        // style prop이 배열/객체 모두 가능
        return Array.isArray(style)
          ? [base, ...style, pressedStyle]
          : [base, style as ViewStyle, pressedStyle];
      }}
      {...rest}
    >
      {children}
    </Pressable>
  );
});
