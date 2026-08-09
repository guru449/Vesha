import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { STYLE_PREFERENCE_OPTIONS } from '@/lib/insights';

export default function ProfileScreen() {
  const { user, items, outfits, wearHistory, updateProfile } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [height, setHeight] = useState(
    user?.heightCm ? String(user.heightCm) : '',
  );
  const [weight, setWeight] = useState(
    user?.weightKg ? String(user.weightKg) : '',
  );
  const [preferences, setPreferences] = useState<string[]>(
    user?.stylePreferences ?? [],
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPreferences(user?.stylePreferences ?? []);
  }, [user?.stylePreferences]);

  const togglePreference = (option: string) => {
    setPreferences((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  };

  const onSave = async () => {
    await updateProfile({
      name: name.trim() || user?.name,
      heightCm: height ? Number(height) : undefined,
      weightKg: weight ? Number(weight) : undefined,
      stylePreferences: preferences,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Text variant="hero">Profile</Text>
        <Text variant="body" color={colors.muted}>
          Demo profile for easy testing. Preferences power Today’s stylist.
        </Text>
      </Animated.View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text variant="title">{items.length}</Text>
          <Text variant="caption" color={colors.muted}>
            Pieces
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title">{outfits.length}</Text>
          <Text variant="caption" color={colors.muted}>
            Outfits
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title">{wearHistory.length}</Text>
          <Text variant="caption" color={colors.muted}>
            Wears
          </Text>
        </View>
      </View>

      <Pressable style={styles.insightsCard} onPress={() => router.push('/insights')}>
        <Text variant="caption" color={colors.primary}>
          New
        </Text>
        <Text variant="subtitle">Wardrobe insights</Text>
        <Text variant="body" color={colors.muted}>
          Most worn pieces, neglected items, and your category mix.
        </Text>
      </Pressable>

      <View style={styles.form}>
        <Input label="Name" value={name} onChangeText={setName} />
        <Input
          label="Email"
          value={user?.email ?? ''}
          editable={false}
          style={{ color: colors.muted }}
        />
        <Input
          label="Height (cm)"
          keyboardType="numeric"
          value={height}
          onChangeText={setHeight}
          hint="Saved for later avatar sizing"
        />
        <Input
          label="Weight (kg)"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          hint="Saved for later avatar sizing"
        />

        <View style={styles.prefBlock}>
          <Text variant="caption" color={colors.muted}>
            Style preferences
          </Text>
          <Text variant="body" color={colors.muted}>
            Used by Today’s outfit suggestions.
          </Text>
          <View style={styles.prefWrap}>
            {STYLE_PREFERENCE_OPTIONS.map((option) => (
              <Chip
                key={option}
                label={option}
                selected={preferences.includes(option)}
                onPress={() => togglePreference(option)}
              />
            ))}
          </View>
        </View>

        <View style={styles.laterCard}>
          <Text variant="caption" color={colors.primary}>
            Coming later
          </Text>
          <Text variant="bodyMedium">Avatar & photo upload</Text>
          <Text variant="body" color={colors.muted}>
            We’ll use height, weight, and an optional full-body photo to build
            your try-on avatar in a later phase.
          </Text>
        </View>

        <Button label={saved ? 'Saved' : 'Save profile'} onPress={onSave} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  insightsCard: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  prefBlock: {
    gap: spacing.sm,
  },
  prefWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  laterCard: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 6,
  },
});
