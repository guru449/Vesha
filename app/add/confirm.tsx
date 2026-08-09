import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { mockAiIdentify } from '@/data/mockWardrobe';
import type { ClothingCategory } from '@/constants/theme';
import { colors, radii, spacing } from '@/constants/theme';

const CATEGORY_OPTIONS: ClothingCategory[] = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Jewelry',
  'Accessories',
];

export default function ConfirmAttributesScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const { addItem } = useApp();
  const insets = useSafeAreaInsets();

  const suggestion = useMemo(
    () =>
      mockAiIdentify(
        imageUri ||
          'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=80',
      ),
    [imageUri],
  );

  const [name, setName] = useState(suggestion.suggestedName);
  const [category, setCategory] = useState<ClothingCategory>(
    suggestion.attributes.category,
  );
  const [color, setColor] = useState(suggestion.attributes.color);
  const [pattern, setPattern] = useState(suggestion.attributes.pattern);
  const [material, setMaterial] = useState(suggestion.attributes.material);
  const [style, setStyle] = useState(suggestion.attributes.style);
  const [occasion, setOccasion] = useState(suggestion.attributes.occasion);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      await addItem({
        id: `item-${Date.now()}`,
        name: name.trim() || 'Untitled piece',
        imageUri: suggestion.imageUri,
        attributes: {
          category,
          color,
          pattern,
          material,
          style,
          occasion,
        },
        createdAt: new Date().toISOString(),
        aiConfidence: suggestion.confidence,
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
        <View style={styles.banner}>
          <Text variant="caption" color={colors.primary}>
            AI suggestion · {Math.round(suggestion.confidence * 100)}% confidence
          </Text>
          <Text variant="body" color={colors.muted}>
            Review and correct anything that looks off before saving.
          </Text>
        </View>

        <Image
          source={{ uri: suggestion.imageUri }}
          style={styles.image}
          contentFit="cover"
        />

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
          aiSuggested
          onChangeText={setColor}
        />
        <AttributeField
          label="Pattern"
          value={pattern}
          editable
          aiSuggested
          onChangeText={setPattern}
        />
        <AttributeField
          label="Material"
          value={material}
          editable
          aiSuggested
          onChangeText={setMaterial}
        />
        <AttributeField
          label="Style"
          value={style}
          editable
          aiSuggested
          onChangeText={setStyle}
        />
        <AttributeField
          label="Occasion"
          value={occasion}
          editable
          aiSuggested
          onChangeText={setOccasion}
        />

        <Button
          label={saving ? 'Saving…' : 'Save to wardrobe'}
          onPress={onSave}
          disabled={saving}
        />
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
  image: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
});
