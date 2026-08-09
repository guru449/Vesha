import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { colors, radii, spacing } from '@/constants/theme';

type Props = {
  label: string;
  value: string;
  editable?: boolean;
  onChangeText?: (value: string) => void;
  aiSuggested?: boolean;
};

export function AttributeField({
  label,
  value,
  editable,
  onChangeText,
  aiSuggested,
}: Props) {
  if (editable) {
    return (
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        hint={aiSuggested ? 'AI suggested — tap to correct' : undefined}
      />
    );
  }

  return (
    <View style={styles.row}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

type SelectRowProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function SelectChips({ label, value, options, onChange }: SelectRowProps) {
  return (
    <View style={styles.selectWrap}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text
                variant="caption"
                color={selected ? colors.white : colors.inkSoft}
                style={styles.optionLabel}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  selectWrap: {
    gap: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
