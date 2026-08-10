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
import {
  analyzeImageQuality,
  type ImageQualityReport,
} from '@/lib/imageQuality';
import { saveWardrobeImage } from '@/lib/uploadImage';
import { colors, radii, spacing } from '@/constants/theme';

export default function AddItemScreen() {
  const { addItem, pendingImageUri, setPendingImageUri, user } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    'idle' | 'picking' | 'checking' | 'ai' | 'saving'
  >('idle');
  const [quality, setQuality] = useState<ImageQualityReport | null>(null);
  const [overrideQuality, setOverrideQuality] = useState(false);

  // After a successful save, pending image is cleared — reset the Add form too.
  useFocusEffect(
    useCallback(() => {
      if (!pendingImageUri) {
        setImageUri(null);
        setBusy('idle');
        setQuality(null);
        setOverrideQuality(false);
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

  const applyPickedImage = async (
    uri: string,
    size?: { width?: number; height?: number },
  ) => {
    setBusy('checking');
    setOverrideQuality(false);
    setQuality(null);
    try {
      const persisted = await saveWardrobeImage(uri, user?.id);
      setImageUri(persisted);
      setPendingImageUri(persisted);
      const report = await analyzeImageQuality(persisted, size);
      setQuality(report);
    } catch (error) {
      showMessage(
        'Could not check photo',
        error instanceof Error ? error.message : 'Please try another photo.',
      );
      setImageUri(uri);
      setPendingImageUri(uri);
    } finally {
      setBusy('idle');
    }
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
          const asset = result.assets[0];
          await applyPickedImage(asset.uri, {
            width: asset.width,
            height: asset.height,
          });
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
        const asset = result.assets[0];
        await applyPickedImage(asset.uri, {
          width: asset.width,
          height: asset.height,
        });
      }
    } finally {
      setBusy((current) => (current === 'picking' ? 'idle' : current));
    }
  };

  const qualityBlocked =
    Boolean(quality && !quality.ok && !overrideQuality);

  const runAi = async (forceNoMatch = false) => {
    if (!imageUri || qualityBlocked) return;
    setBusy('ai');
    setPendingImageUri(imageUri);
    router.push({
      pathname: '/add/confirm',
      params: {
        mode: forceNoMatch ? 'unmatched' : 'ai',
      },
    });
    setBusy('idle');
  };

  const addAsIs = async () => {
    if (!imageUri || qualityBlocked) return;
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
      setQuality(null);
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
    if (!imageUri || qualityBlocked) return;
    setPendingImageUri(imageUri);
    router.push({
      pathname: '/add/confirm',
      params: { mode: 'manual' },
    });
  };

  const clearImage = () => {
    setImageUri(null);
    setPendingImageUri(null);
    setQuality(null);
    setOverrideQuality(false);
  };

  const disabled = !imageUri || busy !== 'idle' || qualityBlocked;

  return (
    <Screen scroll>
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <Text variant="hero">Add a piece</Text>
        <Text variant="body" color={colors.muted}>
          Snap or upload clothing. We check lighting and sharpness before AI
          tagging.
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
              onPress={clearImage}
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

      {busy === 'checking' ? (
        <View style={styles.qualityCard}>
          <ActivityIndicator color={colors.primary} />
          <Text variant="body" color={colors.muted}>
            Checking photo quality…
          </Text>
        </View>
      ) : null}

      {quality && busy !== 'checking' ? (
        <View
          style={[
            styles.qualityCard,
            !quality.ok && !overrideQuality
              ? styles.qualityBad
              : quality.issues.length
                ? styles.qualityWarn
                : styles.qualityGood,
          ]}
        >
          <View style={styles.qualityTop}>
            <Ionicons
              name={
                !quality.ok && !overrideQuality
                  ? 'alert-circle'
                  : quality.issues.length
                    ? 'warning-outline'
                    : 'checkmark-circle'
              }
              size={20}
              color={
                !quality.ok && !overrideQuality
                  ? colors.danger
                  : quality.issues.length
                    ? colors.accent
                    : colors.success
              }
            />
            <Text variant="bodyMedium">
              {!quality.ok && !overrideQuality
                ? 'Photo needs a retake'
                : quality.issues.length
                  ? overrideQuality
                    ? 'Continuing with warnings'
                    : 'Photo could be better'
                  : 'Looks good for tagging'}
            </Text>
            <Text variant="caption" color={colors.muted}>
              {quality.score}/100
            </Text>
          </View>
          {quality.issues.length ? (
            <View style={styles.issueList}>
              {quality.issues.map((issue) => (
                <Text
                  key={issue.code}
                  variant="caption"
                  color={colors.inkSoft}
                >
                  · {issue.message}
                </Text>
              ))}
            </View>
          ) : (
            <Text variant="caption" color={colors.muted}>
              Lighting and sharpness look solid.
            </Text>
          )}
          {!quality.ok && !overrideQuality ? (
            <View style={styles.qualityActions}>
              <Button
                label="Retake / choose another"
                onPress={() => pickImage(true)}
              />
              <Button
                label="Use photo anyway"
                variant="secondary"
                onPress={() => setOverrideQuality(true)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

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
  qualityCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.primaryMist,
  },
  qualityGood: {
    backgroundColor: colors.primaryMist,
  },
  qualityWarn: {
    backgroundColor: colors.accentSoft,
  },
  qualityBad: {
    backgroundColor: colors.dangerSoft,
  },
  qualityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  issueList: {
    gap: 4,
  },
  qualityActions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
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
