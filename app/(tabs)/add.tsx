import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/constants/theme';

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const pickImage = async (fromCamera: boolean) => {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const runAi = async () => {
    if (!imageUri) return;
    setAnalyzing(true);
    // Simulate AI recognition latency for Phase 1 UX.
    await new Promise((resolve) => setTimeout(resolve, 1400));
    setAnalyzing(false);
    router.push({
      pathname: '/add/confirm',
      params: { imageUri },
    });
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text variant="hero">Add a piece</Text>
        <Text variant="body" color={colors.muted}>
          Snap or upload clothing. Vesha will suggest category, color, and style
          for you to confirm.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(120).duration(500)}>
        {imageUri ? (
          <View style={styles.previewWrap}>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              contentFit="cover"
              transition={250}
            />
            <Pressable
              style={styles.clear}
              onPress={() => setImageUri(null)}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.dropzone}>
            <View style={styles.iconBubble}>
              <Ionicons name="camera-outline" size={28} color={colors.primary} />
            </View>
            <Text variant="subtitle" center>
              Add a clothing photo
            </Text>
            <Text variant="body" color={colors.muted} center>
              Best results with good light and a simple background.
            </Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.actions}>
        <Button
          label="Choose from library"
          variant="secondary"
          onPress={() => pickImage(false)}
        />
        <Button
          label="Take a photo"
          variant="ghost"
          onPress={() => pickImage(true)}
        />
        <Button
          label={analyzing ? 'Identifying…' : 'Identify with AI'}
          onPress={runAi}
          disabled={!imageUri || analyzing}
        />
        {analyzing ? (
          <View style={styles.analyzing}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="caption" color={colors.muted}>
              Reading category, color, pattern, material…
            </Text>
          </View>
        ) : null}
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
  dropzone: {
    minHeight: 320,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  previewWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.surfaceMuted,
  },
  clear: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  analyzing: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
