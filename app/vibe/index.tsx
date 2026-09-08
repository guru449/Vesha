import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { vibeFixtures } from '@/data/vibeFixtures';
import { colors, radii, spacing } from '@/constants/theme';
import { saveWardrobeImage } from '@/lib/uploadImage';
import { useApp } from '@/context/AppContext';

/**
 * Vibe Match entry — pick a demo inspiration or upload your own photo.
 */
export default function VibeMatchEntryScreen() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const openFixture = (fixtureId: string) => {
    router.push({
      pathname: '/vibe/result',
      params: { fixtureId },
    });
  };

  const pickInspiration = async () => {
    setBusy(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showMessage(
          'Photos permission needed',
          'Allow photo access to match a vibe from inspiration.',
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
      const asset = result.assets[0];
      const persisted = await saveWardrobeImage(asset.uri, user?.id);
      router.push({
        pathname: '/vibe/result',
        params: {
          fixtureId: 'upload-street',
          imageUri: persisted,
        },
      });
    } catch (error) {
      showMessage(
        'Could not open photo',
        error instanceof Error ? error.message : 'Try another image.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Vibe Match' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text variant="caption" color={colors.primary}>
            Inspiration → your closet
          </Text>
          <Text variant="title">Turn a vibe into tonight’s look</Text>
          <Text variant="body" color={colors.muted}>
            Upload a street photo or try a demo inspiration. We’ll recreate it
            with what you own — silhouette hacks when something’s missing.
          </Text>
        </View>

        <Pressable
          style={styles.upload}
          onPress={pickInspiration}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Upload inspiration photo"
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Ionicons name="images-outline" size={22} color={colors.primary} />
          )}
          <View style={styles.uploadCopy}>
            <Text variant="bodyMedium">Upload inspiration</Text>
            <Text variant="caption" color={colors.muted}>
              Pinterest, street style, a friend — any photo
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <Text variant="caption" color={colors.muted}>
          Or try a demo vibe
        </Text>

        {vibeFixtures.map((fixture) => (
          <Pressable
            key={fixture.id}
            style={styles.card}
            onPress={() => openFixture(fixture.id)}
            accessibilityRole="button"
            accessibilityLabel={`Match ${fixture.title}`}
          >
            <Image
              source={{ uri: fixture.imageUri }}
              style={styles.cardImage}
              contentFit="cover"
            />
            <View style={styles.cardMeta}>
              <Text variant="bodyMedium">{fixture.title}</Text>
              <Text variant="caption" color={colors.muted} numberOfLines={2}>
                {fixture.subtitle}
              </Text>
              <View style={styles.labels}>
                {fixture.vibeLabels.slice(0, 3).map((label) => (
                  <View key={label} style={styles.label}>
                    <Text variant="caption" color={colors.primary}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  hero: {
    gap: spacing.sm,
  },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  uploadCopy: {
    flex: 1,
    gap: 2,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  cardImage: {
    width: 88,
    height: 110,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  cardMeta: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingRight: spacing.xs,
  },
  labels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  label: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
