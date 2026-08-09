import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import {
  categories,
  colors,
  radii,
  spacing,
  type Category,
} from '@/constants/theme';

const OCCASIONS = ['Casual', 'Work', 'Brunch', 'Evening', 'Travel', 'Sport'];

export default function CreateOutfitScreen() {
  const { outfitId } = useLocalSearchParams<{ outfitId?: string }>();
  const { items, outfits, addOutfit, updateOutfit } = useApp();
  const insets = useSafeAreaInsets();

  const existing = useMemo(
    () => (outfitId ? outfits.find((o) => o.id === outfitId) : undefined),
    [outfitId, outfits],
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [occasion, setOccasion] = useState(existing?.occasion ?? 'Casual');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    existing?.itemIds ?? [],
  );
  const [filter, setFilter] = useState<Category>('All');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setOccasion(existing.occasion ?? 'Casual');
      setSelectedIds(existing.itemIds);
    }
  }, [existing]);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((item) => item.attributes.category === filter);
  }, [items, filter]);

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean),
    [selectedIds, items],
  );

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const onSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (existing) {
        await updateOutfit(existing.id, {
          name: name.trim() || 'Untitled outfit',
          occasion,
          itemIds: selectedIds,
        });
        router.replace(`/outfit/${existing.id}`);
      } else {
        const id = `outfit-${Date.now()}`;
        await addOutfit({
          id,
          name: name.trim() || 'Untitled outfit',
          occasion,
          itemIds: selectedIds,
          createdAt: now,
          updatedAt: now,
        });
        router.replace(`/outfit/${id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{ title: existing ? 'Edit outfit' : 'Create outfit' }}
      />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Input
            label="Outfit name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Weekend brunch"
          />

          <View style={styles.section}>
            <Text variant="caption" color={colors.muted}>
              Occasion
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {OCCASIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={occasion === option}
                  onPress={() => setOccasion(option)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text variant="caption" color={colors.muted}>
              Selected ({selectedItems.length})
            </Text>
            {selectedItems.length === 0 ? (
              <Text variant="body" color={colors.muted}>
                Tap pieces below to build this look.
              </Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedRow}
              >
                {selectedItems.map((item) =>
                  item ? (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleItem(item.id)}
                      style={styles.selectedChip}
                    >
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.selectedImage}
                        contentFit="cover"
                      />
                      <Text variant="caption" numberOfLines={1}>
                        {item.name}
                      </Text>
                    </Pressable>
                  ) : null,
                )}
              </ScrollView>
            )}
          </View>

          <View style={styles.section}>
            <Text variant="caption" color={colors.muted}>
              From your wardrobe
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={filter === option}
                  onPress={() => setFilter(option)}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.grid}>
            {filteredItems.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.id)}
                  style={[styles.piece, selected && styles.pieceSelected]}
                >
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.pieceImage}
                    contentFit="cover"
                  />
                  {selected ? (
                    <View style={styles.check}>
                      <Text variant="caption" color={colors.white}>
                        ✓
                      </Text>
                    </View>
                  ) : null}
                  <Text variant="caption" numberOfLines={1} style={styles.pieceName}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            label={
              saving
                ? 'Saving…'
                : existing
                  ? 'Save changes'
                  : 'Save outfit'
            }
            onPress={onSave}
            disabled={saving || selectedIds.length === 0}
          />
        </View>
      </View>
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
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  chipRow: {
    paddingRight: spacing.md,
  },
  selectedRow: {
    gap: spacing.sm,
  },
  selectedChip: {
    width: 88,
    gap: 6,
  },
  selectedImage: {
    width: 88,
    height: 88,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  piece: {
    width: '31%',
    flexGrow: 1,
    maxWidth: '32%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pieceSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  pieceImage: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: colors.surfaceMuted,
  },
  pieceName: {
    padding: 8,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
