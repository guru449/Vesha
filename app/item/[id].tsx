import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  AttributeField,
  SelectChips,
} from '@/components/wardrobe/AttributeField';
import { useApp } from '@/context/AppContext';
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

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, updateItem, deleteItem, markItemWorn, getItemWearStats } =
    useApp();
  const insets = useSafeAreaInsets();
  const item = useMemo(() => items.find((i) => i.id === id), [items, id]);
  const wearStats = useMemo(
    () => (id ? getItemWearStats(id) : { wearCount: 0 }),
    [getItemWearStats, id],
  );

  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState<ClothingCategory>(
    item?.attributes.category ?? 'Tops',
  );
  const [color, setColor] = useState(item?.attributes.color ?? '');
  const [pattern, setPattern] = useState(item?.attributes.pattern ?? '');
  const [material, setMaterial] = useState(item?.attributes.material ?? '');
  const [style, setStyle] = useState(item?.attributes.style ?? '');
  const [occasion, setOccasion] = useState(item?.attributes.occasion ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wearing, setWearing] = useState(false);
  const [justWorn, setJustWorn] = useState(false);

  if (!item) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Item not found</Text>
        <Button label="Back to wardrobe" onPress={() => router.back()} />
      </View>
    );
  }

  const onSave = async () => {
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: name.trim() || item.name,
        attributes: {
          category,
          color,
          pattern,
          material,
          style,
          occasion,
        },
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const onWearToday = async () => {
    setWearing(true);
    try {
      await markItemWorn(item.id);
      setJustWorn(true);
      setTimeout(() => setJustWorn(false), 1600);
    } finally {
      setWearing(false);
    }
  };

  const onDelete = async () => {
    const message = `Remove “${item.name}” from your wardrobe?`;
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' ? window.confirm(message) : false;
      if (!confirmed) return;
      await deleteItem(item.id);
      router.back();
      return;
    }

    Alert.alert('Delete item', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={{ uri: item.imageUri }}
          style={styles.image}
          contentFit="cover"
          transition={250}
        />

        {item.aiConfidence ? (
          <View style={styles.confidence}>
            <Text variant="caption" color={colors.primary}>
              Originally AI-tagged · {Math.round(item.aiConfidence * 100)}%
            </Text>
          </View>
        ) : null}

        {editing ? (
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
              onChangeText={setColor}
            />
            <AttributeField
              label="Pattern"
              value={pattern}
              editable
              onChangeText={setPattern}
            />
            <AttributeField
              label="Material"
              value={material}
              editable
              onChangeText={setMaterial}
            />
            <AttributeField
              label="Style"
              value={style}
              editable
              onChangeText={setStyle}
            />
            <AttributeField
              label="Occasion"
              value={occasion}
              editable
              onChangeText={setOccasion}
            />
            <Button
              label={saving ? 'Saving…' : 'Save changes'}
              onPress={onSave}
              disabled={saving}
            />
            <Button
              label="Cancel"
              variant="ghost"
              onPress={() => setEditing(false)}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Text variant="title">{item.name}</Text>
            <View style={styles.wearCard}>
              <Text variant="caption" color={colors.primary}>
                Wear tracking
              </Text>
              <Text variant="bodyMedium">
                {wearStats.wearCount === 0
                  ? 'Not worn yet'
                  : `Worn ${wearStats.wearCount}×`}
              </Text>
              <Text variant="caption" color={colors.muted}>
                {wearStats.lastWornAt
                  ? `Last worn ${new Date(wearStats.lastWornAt).toLocaleDateString()}`
                  : 'Log it when you wear this piece alone or in an outfit.'}
              </Text>
              <Button
                label={
                  wearing ? 'Saving…' : justWorn ? 'Logged' : 'Wear today'
                }
                onPress={onWearToday}
                disabled={wearing}
              />
            </View>
            <AttributeField label="Category" value={item.attributes.category} />
            <AttributeField label="Color" value={item.attributes.color} />
            <AttributeField label="Pattern" value={item.attributes.pattern} />
            <AttributeField label="Material" value={item.attributes.material} />
            <AttributeField label="Style" value={item.attributes.style} />
            <AttributeField label="Occasion" value={item.attributes.occasion} />
            <Button label="Edit details" onPress={() => setEditing(true)} />
            <Button label="Delete item" variant="danger" onPress={onDelete} />
          </View>
        )}
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
  image: {
    width: '100%',
    aspectRatio: 0.9,
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceMuted,
  },
  confidence: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  wearCard: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
});
