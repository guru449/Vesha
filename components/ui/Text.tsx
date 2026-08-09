import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { colors, typography } from '@/constants/theme';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  center?: boolean;
};

export function Text({
  variant = 'body',
  color = colors.ink,
  center,
  style,
  ...rest
}: Props) {
  const base = typography[variant] as TextStyle;
  return (
    <RNText
      style={[base, { color }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
