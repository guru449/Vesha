import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  AttributeField,
  SelectChips,
} from '@/components/wardrobe/AttributeField';
import { useApp } from '@/context/AppContext';
import { emptyManualAttributes } from '@/data/mockWardrobe';
import type { ClothingCategory } from '@/constants/theme';
import { colors, radii, spacing } from '@/constants/theme';
import {
  HIGH_CONFIDENCE,
  identifyClothing,
  type AiIdentifyResult,
} from '@/lib/aiIdentify';
import { nameFromColorAndCategory } from '@/lib/nameFromTags';
import { saveWardrobeImage } from '@/lib/uploadImage';

const CATEGORY_OPTIONS: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Jewelry',
  'Accessories',
];

type Mode = 'ai' | 'unmatched' | 'manual' | 'color';

export default function ConfirmAttributesScreen() {
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const mode = (modeParam as Mode) || 'ai';
  const { addItem, pendingImageUri, user } = useApp();
  const insets = useSafeAreaInsets();

  const imageUri = pendingImageUri;

  const [suggestion, setSuggestion] = useState<AiIdentifyResult | null>(null);
  const [aiSource, setAiSource] = useState<'ai' | 'mock' | 'color' | null>(
    null,
  );
  const [liveError, setLiveError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(
    mode === 'ai' || mode === 'unmatched' || mode === 'color',
  );
  const [name, setName] = useState('New piece');
  const [category, setCategory] = useState<ClothingCategory>(
    emptyManualAttributes.category,
  );
  const [color, setColor] = useState(emptyManualAttributes.color);
  const [pattern, setPattern] = useState(emptyManualAttributes.pattern);
  const [material, setMaterial] = useState(emptyManualAttributes.material);
  const [style, setStyle] = useState(emptyManualAttributes.style);
  const [occasion, setOccasion] = useState(emptyManualAttributes.occasion);
  const [editing, setEditing] = useState(mode === 'manual');
  const [needsCategory, setNeedsCategory] = useState(false);
  const [categoryChosen, setCategoryChosen] = useState(false);
  const [nameLocked, setNameLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!imageUri) {
      router.replace('/(tabs)/add');
    }
  }, [imageUri]);

  useEffect(() => {
    if (!imageUri) return;

    if (mode === 'manual') {
      setSuggestion({
        matched: false,
        imageUri,
        confidence: 0,
        reason: 'Add your own details for this piece.',
      });
      setAiSource(null);
      setAnalyzing(false);
      setEditing(true);
      setNeedsCategory(false);
      setCategoryChosen(false);
      return;
    }

    let cancelled = false;
    setAnalyzing(true);
    setLiveError(null);

    (async () => {
      const result = await identifyClothing(imageUri, {
        forceNoMatch: mode === 'unmatched',
        colorAssist: mode === 'color',
      });
      if (cancelled) return;

      setSuggestion(result);
      setAiSource(result.source);
      setLiveError(result.liveError ?? null);
      if (result.matched) {
        const requireCategory = Boolean(result.needsCategory);
        setNeedsCategory(requireCategory);
        setCategoryChosen(!requireCategory);
        setNameLocked(false);
        setName(result.suggestedName);
        setCategory(result.attributes.category);
        setColor(result.attributes.color);
        setPattern(result.attributes.pattern);
        setMaterial(result.attributes.material);
        setStyle(result.attributes.style);
        setOccasion(result.attributes.occasion);
        // Always edit when category is unknown; else one-tap when confident.
        setEditing(
          requireCategory || result.confidence < HIGH_CONFIDENCE,
        );
      } else {
        setNeedsCategory(false);
        setCategoryChosen(false);
        setEditing(Boolean(result.liveError));
      }
      setAnalyzing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUri, mode]);

  if (!imageUri) {
    return null;
  }

  const matched = suggestion?.matched === true;
  const confidencePct =
    matched && suggestion ? Math.round(suggestion.confidence * 100) : 0;
  const canSaveTagged = !needsCategory || categoryChosen;

  const onPickCategory = (value: ClothingCategory) => {
    setCategory(value);
    setCategoryChosen(true);
    if (!nameLocked) {
      setName(nameFromColorAndCategory(color, value));
    }
    // Sensible style defaults once the user names the garment type.
    if (needsCategory) {
      if (value === 'Bottoms' && style === 'Unknown') setStyle('Relaxed');
      if (value === 'Tops' && style === 'Unknown') setStyle('Casual');
      if (value === 'Shoes' && style === 'Unknown') setStyle('Sneaker');
      if (value === 'Dresses' && style === 'Unknown') setStyle('Midi');
    }
  };

  const saveItem = async (options?: {
    asPhotoOnly?: boolean;
    withAiConfidence?: number;
  }) => {
    if (!options?.asPhotoOnly && !canSaveTagged) return;
    setSaving(true);
    try {
      const persisted = await saveWardrobeImage(imageUri, user?.id);
      const newId = `item-${Date.now()}`;
      await addItem({
        id: newId,
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
      router.replace({
        pathname: '/add/ways',
        params: { itemId: newId },
      });
    } finally {
      setSaving(false);
    }
  };

  const summaryChips = matched
    ? [category, color, style, occasion].filter(
        (value, index, all) =>
          value &&
          value !== 'Unknown' &&
          all.indexOf(value) === index,
      )
    : [];

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {analyzing ? (
          <View style={styles.banner}>
            <ActivityIndicator color={colors.primary} />
            <Text variant="caption" color={colors.primary}>
              Analyzing your piece…
            </Text>
            <Text variant="body" color={colors.muted}>
              Reading category, color, fabric, and style.
            </Text>
          </View>
        ) : matched && suggestion && needsCategory ? (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Text variant="caption" color={colors.accent}>
              Color detected
              {color && color !== 'Unknown' ? ` · ${color}` : ''}
            </Text>
            <Text variant="body" color={colors.muted}>
              Offline color assist can’t see garment type. Pick a category
              below — we’ll name it for you.
            </Text>
          </View>
        ) : matched && suggestion ? (
          <View style={styles.banner}>
            <Text variant="caption" color={colors.primary}>
              {aiSource === 'ai'
                ? 'Live vision AI'
                : aiSource === 'color'
                  ? 'Color assist'
                  : 'Suggestion'}{' '}
              · {confidencePct}% confidence
            </Text>
            <Text variant="body" color={colors.muted}>
              {suggestion.confidence >= HIGH_CONFIDENCE
                ? 'Looks good? Add it in one tap, or edit details.'
                : 'Double-check these tags — confidence is a bit lower.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.banner, styles.bannerWarn]}>
            <Text variant="caption" color={colors.accent}>
              {mode === 'manual'
                ? 'Manual entry'
                : liveError
                  ? 'Live vision AI unavailable'
                  : 'AI couldn’t identify this clearly'}
            </Text>
            <Text variant="body" color={colors.muted}>
              {suggestion && suggestion.matched === false
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

        {analyzing ? (
          <View style={styles.analyzingBlock}>
            <Text variant="body" color={colors.muted}>
              Hang tight — this usually takes a couple of seconds.
            </Text>
          </View>
        ) : !matched && !editing ? (
          <View style={styles.actions}>
            <Button
              label={saving ? 'Saving…' : 'Add photo anyway'}
              onPress={() => saveItem({ asPhotoOnly: true })}
              disabled={saving}
            />
            <Button
              label="Enter details manually"
              variant="secondary"
              onPress={() => setEditing(true)}
              disabled={saving}
            />
            <Button
              label="Take another photo"
              variant="ghost"
              onPress={() => router.replace('/(tabs)/add')}
              disabled={saving}
            />
          </View>
        ) : matched && !editing && !needsCategory ? (
          <View style={styles.summary}>
            <Text variant="title">{name}</Text>
            <View style={styles.chipRow}>
              {summaryChips.map((chip) => (
                <View key={chip} style={styles.chip}>
                  <Text variant="caption" color={colors.primary}>
                    {chip}
                  </Text>
                </View>
              ))}
            </View>
            <Button
              label={saving ? 'Saving…' : 'Add to wardrobe'}
              onPress={() =>
                saveItem({
                  withAiConfidence: suggestion?.confidence,
                })
              }
              disabled={saving}
            />
            <Pressable
              onPress={() => setEditing(true)}
              disabled={saving}
              accessibilityRole="button"
              style={styles.editLink}
            >
              <Text variant="body" color={colors.primary}>
                Edit details
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <SelectChips
              label={needsCategory ? 'What is this? (required)' : 'Category'}
              value={categoryChosen || !needsCategory ? category : undefined}
              options={CATEGORY_OPTIONS}
              onChange={(value) => onPickCategory(value as ClothingCategory)}
            />

            <Input
              label="Name"
              value={name}
              onChangeText={(text) => {
                setNameLocked(true);
                setName(text);
              }}
            />

            <AttributeField
              label="Color"
              value={color}
              editable
              aiSuggested={matched}
              onChangeText={(text) => {
                setColor(text);
                if (!nameLocked && categoryChosen) {
                  setName(nameFromColorAndCategory(text, category));
                }
              }}
            />
            <AttributeField
              label="Pattern"
              value={pattern}
              editable
              aiSuggested={matched && pattern !== 'Unknown'}
              onChangeText={setPattern}
            />
            <AttributeField
              label="Material"
              value={material}
              editable
              aiSuggested={matched && material !== 'Unknown'}
              onChangeText={setMaterial}
            />
            <AttributeField
              label="Style"
              value={style}
              editable
              aiSuggested={matched && style !== 'Unknown'}
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
              label={
                saving
                  ? 'Saving…'
                  : !canSaveTagged
                    ? 'Pick a category to continue'
                    : 'Add to wardrobe'
              }
              onPress={() =>
                saveItem({
                  withAiConfidence:
                    matched && suggestion && !needsCategory
                      ? suggestion.confidence
                      : undefined,
                })
              }
              disabled={saving || !canSaveTagged}
            />

            {matched && !needsCategory ? (
              <Pressable
                onPress={() => setEditing(false)}
                disabled={saving}
                accessibilityRole="button"
                style={styles.editLink}
              >
                <Text variant="body" color={colors.muted}>
                  Hide details
                </Text>
              </Pressable>
            ) : (
              <Button
                label="Just add the photo"
                variant="ghost"
                onPress={() => saveItem({ asPhotoOnly: true })}
                disabled={saving}
              />
            )}
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
    gap: 6,
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
  analyzingBlock: {
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  summary: {
    gap: spacing.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  editLink: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
});
