import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OutfitAvatar } from '@/components/avatar/OutfitAvatar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { STYLE_PREFERENCE_OPTIONS } from '@/lib/insights';
import { saveWardrobeImage } from '@/lib/uploadImage';

export default function ProfileScreen() {
  const {
    user,
    items,
    outfits,
    wearHistory,
    updateProfile,
    signOut,
    backendMode,
  } = useApp();
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
  const [avatarBusy, setAvatarBusy] = useState(false);

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

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const pickAvatar = async () => {
    setAvatarBusy(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showMessage(
          'Photos permission needed',
          'Allow photo access to set your try-on avatar.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (result.canceled) return;
      const persisted = await saveWardrobeImage(
        result.assets[0].uri,
        user?.id,
      );
      await updateProfile({ avatarUri: persisted });
    } catch (error) {
      showMessage(
        'Could not update avatar',
        error instanceof Error ? error.message : 'Try another photo.',
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const clearAvatar = async () => {
    await updateProfile({ avatarUri: undefined });
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

  const previewPieces = items.slice(0, 4);

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Text variant="hero">Profile</Text>
        <Text variant="body" color={colors.muted}>
          Preferences power Today’s stylist — and your try-on avatar.
        </Text>
        <View style={styles.modeChip}>
          <Text variant="caption" color={colors.primary}>
            {backendMode === 'cloud'
              ? 'Cloud sync · Supabase'
              : 'Local demo · device only'}
          </Text>
        </View>
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

      <Pressable style={styles.insightsCard} onPress={() => router.push('/health')}>
        <Text variant="caption" color={colors.primary}>
          New
        </Text>
        <Text variant="subtitle">Wardrobe Health</Text>
        <Text variant="body" color={colors.muted}>
          AI check: idle pieces, versatility scores, and closet gaps.
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryCard}
        onPress={() => router.push('/calendar')}
      >
        <Text variant="subtitle">This week</Text>
        <Text variant="body" color={colors.muted}>
          Mon–Sun strip of what you wore — tap a day to review or log.
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryCard}
        onPress={() => router.push('/insights')}
      >
        <Text variant="subtitle">Wear insights</Text>
        <Text variant="body" color={colors.muted}>
          Most worn pieces, neglected items, and your category mix.
        </Text>
      </Pressable>

      <View style={styles.form}>
        <View style={styles.avatarBlock}>
          <Text variant="caption" color={colors.muted}>
            Try-on avatar
          </Text>
          <View style={styles.avatarRow}>
            <View style={styles.avatarPreview}>
              {user?.avatarUri ? (
                <Image
                  source={{ uri: user.avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <OutfitAvatar
                  pieces={previewPieces}
                  heightCm={height ? Number(height) : user?.heightCm}
                  compact
                  emptyLabel="Silhouette"
                />
              )}
            </View>
            <View style={styles.avatarActions}>
              <Text variant="body" color={colors.muted}>
                Optional full-body photo. Height tunes silhouette proportions.
                Without a photo we use a soft figure.
              </Text>
              <Button
                label={avatarBusy ? 'Uploading…' : 'Upload photo'}
                onPress={pickAvatar}
                disabled={avatarBusy}
              />
              {user?.avatarUri ? (
                <Pressable onPress={clearAvatar} hitSlop={8}>
                  <Text variant="caption" color={colors.muted}>
                    Use silhouette instead
                  </Text>
                </Pressable>
              ) : null}
              {avatarBusy ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <View style={styles.avatarHintRow}>
                  <Ionicons
                    name="shirt-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text variant="caption" color={colors.primary}>
                    Used on Today, Vibe Match, and Create Look
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

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
          hint="Tunes avatar proportions"
        />
        <Input
          label="Weight (kg)"
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
          hint="Saved with your profile"
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

        <Button label={saved ? 'Saved' : 'Save profile'} onPress={onSave} />
        <Button
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          }}
        />
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
  modeChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginBottom: spacing.sm,
  },
  secondaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  avatarBlock: {
    gap: spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  avatarPreview: {
    width: 112,
  },
  avatarImage: {
    width: 112,
    height: 140,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  avatarActions: {
    flex: 1,
    gap: spacing.sm,
  },
  avatarHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prefBlock: {
    gap: spacing.sm,
  },
  prefWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
