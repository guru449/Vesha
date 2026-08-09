import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, items, updateProfile, signOut } = useApp();
  const [name, setName] = useState(user?.name ?? '');
  const [height, setHeight] = useState(
    user?.heightCm ? String(user.heightCm) : '',
  );
  const [weight, setWeight] = useState(
    user?.weightKg ? String(user.weightKg) : '',
  );
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    await updateProfile({
      name: name.trim() || user?.name,
      heightCm: height ? Number(height) : undefined,
      weightKg: weight ? Number(weight) : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/welcome');
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Text variant="hero">Profile</Text>
        <Text variant="body" color={colors.muted}>
          Basic details for Phase 1. Avatar & try-on come later.
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
          <Text variant="title">
            {new Set(items.map((i) => i.attributes.category)).size}
          </Text>
          <Text variant="caption" color={colors.muted}>
            Categories
          </Text>
        </View>
        <View style={styles.stat}>
          <Text variant="title">
            {user?.stylePreferences?.length ?? 0}
          </Text>
          <Text variant="caption" color={colors.muted}>
            Preferences
          </Text>
        </View>
      </View>

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
        />
        <Input
          label="Weight (kg)"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        {user?.stylePreferences?.length ? (
          <View style={styles.prefs}>
            <Text variant="caption" color={colors.muted}>
              Style preferences
            </Text>
            <Text variant="bodyMedium">
              {user.stylePreferences.join(' · ')}
            </Text>
          </View>
        ) : null}

        <Button label={saved ? 'Saved' : 'Save profile'} onPress={onSave} />
        <Button label="Sign out" variant="ghost" onPress={onSignOut} />
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
    marginBottom: spacing.lg,
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
  form: {
    gap: spacing.md,
  },
  prefs: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
});
