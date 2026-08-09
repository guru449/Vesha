import { Pressable, StyleSheet, Text as RNText } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <RNText
        numberOfLines={1}
        style={[styles.label, selected ? styles.labelSelected : styles.labelIdle]}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  labelIdle: {
    color: colors.inkSoft,
  },
  labelSelected: {
    color: colors.white,
  },
});
