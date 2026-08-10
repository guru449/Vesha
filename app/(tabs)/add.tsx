import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { emptyManualAttributes } from '@/data/mockWardrobe';
import { saveWardrobeImage } from '@/lib/uploadImage';
import { colors, radii, spacing } from '@/constants/theme';

export default function AddItemScreen() {
  const { addItem, pendingImageUri, setPendingImageUri, user } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<'idle' | 'picking' | 'ai' | 'saving'>('idle');

  // After a successful save, pending image is cleared — reset the Add form too.
  useFocusEffect(
    useCallback(() => {
      if (!pendingImageUri) {
        setImageUri(null);
        setBusy('idle');
      }
    }, [pendingImageUri]),
  );

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const pickImage = async (fromCamera: boolean) => {
    setBusy('picking');
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showMessage(
            'Camera permission needed',
            'Allow camera access to photograph clothing.',
          );
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsEditing: true,
          aspect: [3, 4],
        });
        if (!result.canceled) {
          const persisted = await saveWardrobeImage(
            result.assets[0].uri,
            user?.id,
          );
          setImageUri(persisted);
          setPendingImageUri(persisted);
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showMessage(
          'Photos permission needed',
          'Allow photo library access to upload clothing.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect: [3, 4],
      });
      if (!result.canceled) {
        const persisted = await saveWardrobeImage(
          result.assets[0].uri,
          user?.id,
        );
        setImageUri(persisted);
        setPendingImageUri(persisted);
      }
    } finally {
      setBusy('idle');
    }
  };

  const runAi = async (forceNoMatch = false) => {
    if (!imageUri) return;
    setBusy('ai');
    setPendingImageUri(imageUri);
    // Recognition runs on the confirm screen (live AI or mock fallback).
    router.push({
      pathname: '/add/confirm',
      params: {
        mode: forceNoMatch ? 'unmatched' : 'ai',
      },
    });
    setBusy('idle');
  };

  const addAsIs = async () => {
    if (!imageUri) return;
    setBusy('saving');
    try {
      const persisted = await saveWardrobeImage(imageUri, user?.id);
      await addItem({
        id: `item-${Date.now()}`,
        name: 'New piece',
        imageUri: persisted,
        attributes: {
          ...emptyManualAttributes,
          category: 'Accessories',
          color: 'Unlabeled',
          style: 'Photo only',
          occasion: 'Everyday',
        },
        createdAt: new Date().toISOString(),
      });
      setImageUri(null);
      router.replace('/(tabs)/wardrobe');
    } catch (error) {
      showMessage(
        'Could not save photo',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy('idle');
    }
  };

  const goManual = () => {
    if (!imageUri) return;
    setPendingImageUri(imageUri);
    router.push({
      pathname: '/add/confirm',
      params: { mode: 'manual' },
    });
  };

  const disabled = !imageUri || busy !== 'idle';

  return (
    <Screen scroll>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text variant="hero">Add a piece</Text>
        <Text variant="body" color={colors.muted}>
          Snap or upload clothing. Identify with AI, or add the photo as-is if
          you just want it in your wardrobe.
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
              onPress={() => {
                setImageUri(null);
                setPendingImageUri(null);
              }}
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
          disabled={busy !== 'idle'}
        />
        <Button
          label="Take a photo"
          variant="ghost"
          onPress={() => pickImage(true)}
          disabled={busy !== 'idle'}
        />

        {imageUri ? (
          <>
            <Button
              label={busy === 'ai' ? 'Identifying…' : 'Identify with AI'}
              onPress={() => runAi(false)}
              disabled={disabled}
            />
            <Button
              label={busy === 'saving' ? 'Saving…' : 'Add photo as-is'}
              variant="secondary"
              onPress={addAsIs}
              disabled={disabled}
            />
            <Button
              label="Enter details manually"
              variant="ghost"
              onPress={goManual}
              disabled={disabled}
            />
            <Pressable
              onPress={() => runAi(true)}
              disabled={disabled}
              style={styles.demoLink}
            >
              <Text variant="caption" color={colors.muted} center>
                Demo: simulate “AI couldn’t identify”
              </Text>
            </Pressable>
          </>
        ) : null}

        {busy === 'ai' ? (
          <View style={styles.analyzing}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="caption" color={colors.muted}>
              Looking for clothing, color, pattern, material…
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
  demoLink: {
    paddingVertical: spacing.sm,
  },
});
