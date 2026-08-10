import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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

export default function TweakSuggestionScreen() {
  const {
    title: titleParam,
    occasion: occasionParam,
    itemIds: itemIdsParam,
    sourceOutfitId,
  } = useLocalSearchParams<{
    title?: string;
    occasion?: string;
    itemIds?: string;
    sourceOutfitId?: string;
  }>();

  const {
    items,
    outfits,
    addOutfit,
    updateOutfit,
    markOutfitWorn,
  } = useApp();
  const insets = useSafeAreaInsets();

  const initialIds = useMemo(
    () =>
      (itemIdsParam || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    [itemIdsParam],
  );

  const sourceOutfit = useMemo(
    () =>
      sourceOutfitId
        ? outfits.find((outfit) => outfit.id === sourceOutfitId)
        : undefined,
    [sourceOutfitId, outfits],
  );

  const [name, setName] = useState(
    titleParam || sourceOutfit?.name || 'Today look',
  );
  const [occasion, setOccasion] = useState(
    occasionParam || sourceOutfit?.occasion || 'Casual',
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [filter, setFilter] = useState<Category>('All');
  const [busy, setBusy] = useState<'idle' | 'saving' | 'wearing'>('idle');

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
    setBusy('saving');
    try {
      const now = new Date().toISOString();
      const trimmed = name.trim() || 'Today look';
      if (sourceOutfit) {
        await updateOutfit(sourceOutfit.id, {
          name: trimmed,
          occasion,
          itemIds: selectedIds,
        });
        router.replace(`/outfit/${sourceOutfit.id}`);
        return;
      }
      const id = `outfit-${Date.now()}`;
      await addOutfit({
        id,
        name: trimmed,
        occasion,
        itemIds: selectedIds,
        createdAt: now,
        updatedAt: now,
      });
      router.replace(`/outfit/${id}`);
    } finally {
      setBusy('idle');
    }
  };

  const onWear = async () => {
    if (selectedIds.length === 0) return;
    setBusy('wearing');
    try {
      const now = new Date().toISOString();
      const trimmed = name.trim() || 'Today look';
      if (sourceOutfit) {
        // Wear the tweaked pieces without forcing a save first.
        await markOutfitWorn(sourceOutfit.id, {
          ...sourceOutfit,
          name: trimmed,
          occasion,
          itemIds: selectedIds,
          updatedAt: now,
        });
      } else {
        const id = `outfit-${Date.now()}`;
        await markOutfitWorn(id, {
          id,
          name: trimmed,
          occasion,
          itemIds: selectedIds,
          createdAt: now,
          updatedAt: now,
        });
      }
      router.replace('/(tabs)/today');
    } finally {
      setBusy('idle');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Tweak look' }} />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="body" color={colors.muted}>
            Swap or drop pieces, then wear or save. Your suggestion is only a
            starting point.
          </Text>

          <Input
            label="Look name"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Easy Friday"
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
              In this look ({selectedItems.length})
            </Text>
            {selectedItems.length === 0 ? (
              <Text variant="body" color={colors.muted}>
                Tap pieces below to add them.
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
                      <Text variant="caption" color={colors.primary}>
                        Tap to remove
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
                  <Text
                    variant="caption"
                    numberOfLines={1}
                    style={styles.pieceName}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <Button
            label={busy === 'wearing' ? 'Saving…' : 'Wear today'}
            onPress={onWear}
            disabled={busy !== 'idle' || selectedIds.length === 0}
          />
          <Button
            label={
              busy === 'saving'
                ? 'Saving…'
                : sourceOutfit
                  ? 'Save changes'
                  : 'Save outfit'
            }
            variant="secondary"
            onPress={onSave}
            disabled={busy !== 'idle' || selectedIds.length === 0}
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
    width: 96,
    gap: 4,
  },
  selectedImage: {
    width: 96,
    height: 96,
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
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
