import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutfitAvatar } from '@/components/avatar/OutfitAvatar';
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
  const { outfitId, prefillIds } = useLocalSearchParams<{
    outfitId?: string;
    prefillIds?: string;
  }>();
  const { items, outfits, addOutfit, updateOutfit, user } = useApp();
  const insets = useSafeAreaInsets();

  const existing = useMemo(
    () => (outfitId ? outfits.find((o) => o.id === outfitId) : undefined),
    [outfitId, outfits],
  );

  const prefillList = useMemo(() => {
    if (!prefillIds || typeof prefillIds !== 'string') return [];
    return prefillIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }, [prefillIds]);

  const [name, setName] = useState(existing?.name ?? '');
  const [occasion, setOccasion] = useState(existing?.occasion ?? 'Casual');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    existing?.itemIds ?? prefillList,
  );
  const [filter, setFilter] = useState<Category>('All');
  const [saving, setSaving] = useState(false);
  const [showDetails, setShowDetails] = useState(
    Boolean(existing) || prefillList.length > 0,
  );

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setOccasion(existing.occasion ?? 'Casual');
      setSelectedIds(existing.itemIds);
      setShowDetails(true);
    } else if (prefillList.length > 0) {
      setSelectedIds(prefillList);
      setShowDetails(true);
    }
  }, [existing, prefillList]);

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;
    return items.filter((item) => item.attributes.category === filter);
  }, [items, filter]);

  const selectedPieces = useMemo(
    () =>
      selectedIds
        .map((id) => items.find((item) => item.id === id))
        .filter(Boolean) as typeof items,
    [selectedIds, items],
  );

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const resolvedName = () => {
    const trimmed = name.trim();
    if (trimmed) return trimmed;
    return `${occasion} look`;
  };

  const onSave = async () => {
    if (selectedIds.length === 0) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      if (existing) {
        await updateOutfit(existing.id, {
          name: resolvedName(),
          occasion,
          itemIds: selectedIds,
        });
        router.replace(`/outfit/${existing.id}`);
      } else {
        const id = `outfit-${Date.now()}`;
        await addOutfit({
          id,
          name: resolvedName(),
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

  const canSave = selectedIds.length > 0 && !saving;
  const saveLabel = saving
    ? 'Saving…'
    : existing
      ? `Save changes · ${selectedIds.length}`
      : selectedIds.length === 0
        ? 'Pick at least one piece'
        : `Save look · ${selectedIds.length}`;

  return (
    <>
      <Stack.Screen
        options={{ title: existing ? 'Edit look' : 'New look' }}
      />
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 110 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <Text variant="title">
              {existing ? 'Update this look' : 'Build a look'}
            </Text>
            <Text variant="body" color={colors.muted}>
              Tap pieces to add or remove. Save when it feels right.
            </Text>
          </View>

          {selectedPieces.length > 0 ? (
            <View style={styles.preview}>
              <Text variant="caption" color={colors.muted}>
                Try-on preview
              </Text>
              <OutfitAvatar
                pieces={selectedPieces}
                avatarUri={user?.avatarUri}
                heightCm={user?.heightCm}
                style={styles.previewAvatar}
              />
            </View>
          ) : null}

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="body" color={colors.muted}>
                Your wardrobe is empty. Add a few pieces first, then come back
                to build looks.
              </Text>
              <Button
                label="Add a piece"
                onPress={() => router.push('/(tabs)/add')}
              />
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Text variant="caption" color={colors.muted}>
                    Your wardrobe
                  </Text>
                  <Text variant="caption" color={colors.primary}>
                    {selectedIds.length} selected
                  </Text>
                </View>
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
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${item.name}${selected ? ', selected' : ''}`}
                      style={[styles.piece, selected && styles.pieceSelected]}
                    >
                      <Image
                        source={{ uri: item.imageUri }}
                        style={styles.pieceImage}
                        contentFit="cover"
                      />
                      {selected ? (
                        <View style={styles.check}>
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.white}
                          />
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
            </>
          )}

          <Pressable
            onPress={() => setShowDetails((open) => !open)}
            style={styles.detailsToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: showDetails }}
          >
            <Text variant="bodyMedium" color={colors.primary}>
              {showDetails ? 'Hide name & occasion' : 'Name & occasion'}
            </Text>
            <Ionicons
              name={showDetails ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </Pressable>

          {showDetails ? (
            <View style={styles.details}>
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder={`e.g. ${occasion} look`}
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
              {!name.trim() ? (
                <Text variant="caption" color={colors.muted}>
                  Leave the name blank to save as “{occasion} look”.
                </Text>
              ) : null}
            </View>
          ) : (
            <Text variant="caption" color={colors.muted} style={styles.hint}>
              Will save as “{resolvedName()}” · {occasion}
            </Text>
          )}
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <Button label={saveLabel} onPress={onSave} disabled={!canSave} />
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
    gap: spacing.md,
  },
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  preview: {
    gap: spacing.sm,
  },
  previewAvatar: {
    maxWidth: 280,
    alignSelf: 'center',
    width: '70%',
  },
  empty: {
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: {
    paddingRight: spacing.md,
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
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  details: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryMist,
  },
  hint: {
    marginTop: -spacing.xs,
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
