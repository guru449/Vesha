import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  AttributeField,
  SelectChips,
} from '@/components/wardrobe/AttributeField';
import { useApp } from '@/context/AppContext';
import {
  emptyManualAttributes,
  mockAiIdentify,
} from '@/data/mockWardrobe';
import type { ClothingCategory } from '@/constants/theme';
import { colors, radii, spacing } from '@/constants/theme';
import { saveWardrobeImage } from '@/lib/uploadImage';

const CATEGORY_OPTIONS: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Jewelry',
  'Accessories',
];

type Mode = 'ai' | 'unmatched' | 'manual';

export default function ConfirmAttributesScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = (modeParam as Mode) || 'ai';
  const { addItem, pendingImageUri, user } = useApp();
  const insets = useSafeAreaInsets();

  const imageUri = pendingImageUri;

  const suggestion = useMemo(() => {
    if (!imageUri) return null;
    if (mode === 'manual') {
      return {
        matched: false as const,
        imageUri,
        confidence: 0,
        reason: 'Add your own details for this piece.',
      };
    }
    return mockAiIdentify(imageUri, { forceNoMatch: mode === 'unmatched' });
  }, [imageUri, mode]);

  const matched = suggestion?.matched === true;

  const [name, setName] = useState(
    matched ? suggestion.suggestedName : 'New piece',
  );
  const [category, setCategory] = useState<ClothingCategory>(
    matched ? suggestion.attributes.category : emptyManualAttributes.category,
  );
  const [color, setColor] = useState(
    matched ? suggestion.attributes.color : emptyManualAttributes.color,
  );
  const [pattern, setPattern] = useState(
    matched ? suggestion.attributes.pattern : emptyManualAttributes.pattern,
  );
  const [material, setMaterial] = useState(
    matched ? suggestion.attributes.material : emptyManualAttributes.material,
  );
  const [style, setStyle] = useState(
    matched ? suggestion.attributes.style : emptyManualAttributes.style,
  );
  const [occasion, setOccasion] = useState(
    matched ? suggestion.attributes.occasion : emptyManualAttributes.occasion,
  );
  const [showForm, setShowForm] = useState(matched || mode === 'manual');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imageUri) {
      router.replace('/(tabs)/add');
    }
  }, [imageUri]);

  if (!imageUri || !suggestion) {
    return null;
  }

  const saveItem = async (options?: {
    asPhotoOnly?: boolean;
    withAiConfidence?: number;
  }) => {
    setSaving(true);
    try {
      const persisted = await saveWardrobeImage(imageUri, user?.id);
      await addItem({
        id: `item-${Date.now()}`,
        name: options?.asPhotoOnly
          ? 'Photo upload'
          : name.trim() || 'Untitled piece',
        imageUri: persisted,
        attributes: options?.asPhotoOnly
          ? {
              ...emptyManualAttributes,
              category: 'Accessories',
              color: 'Unlabeled',
              style: 'Photo only',
            }
          : {
              category,
              color,
              pattern,
              material,
              style,
              occasion,
            },
        createdAt: new Date().toISOString(),
        aiConfidence: options?.withAiConfidence,
      });
      router.replace('/(tabs)/wardrobe');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {matched ? (
          <View style={styles.banner}>
            <Text variant="caption" color={colors.primary}>
              AI suggestion · {Math.round(suggestion.confidence * 100)}%
              confidence
            </Text>
            <Text variant="body" color={colors.muted}>
              Review and correct anything that looks off before saving.
            </Text>
          </View>
        ) : (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Text variant="caption" color={colors.accent}>
              {mode === 'manual'
                ? 'Manual entry'
                : 'AI couldn’t identify this clearly'}
            </Text>
            <Text variant="body" color={colors.muted}>
              {suggestion.matched === false
                ? suggestion.reason
                : 'Add the photo anyway, or fill in details yourself.'}
            </Text>
          </View>
        )}

        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
        />

        {!matched && !showForm ? (
          <View style={styles.actions}>
            <Button
              label={saving ? 'Saving…' : 'Add photo anyway'}
              onPress={() => saveItem({ asPhotoOnly: true })}
              disabled={saving}
            />
            <Button
              label="Enter details manually"
              variant="secondary"
              onPress={() => setShowForm(true)}
              disabled={saving}
            />
            <Button
              label="Take another photo"
              variant="ghost"
              onPress={() => router.replace('/(tabs)/add')}
              disabled={saving}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Input label="Name" value={name} onChangeText={setName} />

            <SelectChips
              label="Category"
              value={category}
              options={CATEGORY_OPTIONS}
              onChange={(value) => setCategory(value as ClothingCategory)}
            />

            <AttributeField
              label="Color"
              value={color}
              editable
              aiSuggested={matched}
              onChangeText={setColor}
            />
            <AttributeField
              label="Pattern"
              value={pattern}
              editable
              aiSuggested={matched}
              onChangeText={setPattern}
            />
            <AttributeField
              label="Material"
              value={material}
              editable
              aiSuggested={matched}
              onChangeText={setMaterial}
            />
            <AttributeField
              label="Style"
              value={style}
              editable
              aiSuggested={matched}
              onChangeText={setStyle}
            />
            <AttributeField
              label="Occasion"
              value={occasion}
              editable
              aiSuggested={matched}
              onChangeText={setOccasion}
            />

            <Button
              label={saving ? 'Saving…' : 'Save to wardrobe'}
              onPress={() =>
                saveItem({
                  withAiConfidence: matched ? suggestion.confidence : undefined,
                })
              }
              disabled={saving}
            />

            {!matched ? (
              <Button
                label="Just add the photo"
                variant="ghost"
                onPress={() => saveItem({ asPhotoOnly: true })}
                disabled={saving}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
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
  banner: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 4,
  },
  bannerWarn: {
    backgroundColor: colors.accentSoft,
  },
  image: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
});
