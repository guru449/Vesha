import { forwardRef } from 'react';
import { Pressable, StyleSheet, type View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  style?: ViewStyle;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button = forwardRef<View, Props>(function Button(
  { label, onPress, variant = 'primary', disabled, style },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelColor =
    variant === 'secondary'
      ? colors.primary
      : variant === 'ghost'
        ? colors.primary
        : variant === 'onDark'
          ? colors.white
          : colors.white;

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 260 });
      }}
      style={[
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Text variant="bodyMedium" color={labelColor} style={styles.label}>
        {label}
      </Text>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  onDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  danger: {
    backgroundColor: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
