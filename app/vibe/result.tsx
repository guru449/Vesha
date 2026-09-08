import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import {
  matchFixtureById,
  type VibeMatchResult,
} from '@/lib/vibeMatch';

function statusLabel(status: 'exact' | 'hack' | 'gap') {
  if (status === 'exact') return 'In your closet';
  if (status === 'hack') return 'Silhouette hack';
  return 'Gap';
}

function statusColor(status: 'exact' | 'hack' | 'gap') {
  if (status === 'exact') return colors.primary;
  if (status === 'hack') return colors.accent;
  return colors.muted;
}

export default function VibeMatchResultScreen() {
  const { fixtureId, imageUri } = useLocalSearchParams<{
    fixtureId?: string;
    imageUri?: string;
  }>();
  const { items, addOutfit, markOutfitWorn, getItemsByIds } = useApp();
  const insets = useSafeAreaInsets();

  const [excludeItemIds, setExcludeItemIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<'idle' | 'wear' | 'save'>('idle');
  const [justWorn, setJustWorn] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const result: VibeMatchResult | null = useMemo(() => {
    if (!fixtureId) return null;
    return matchFixtureById(fixtureId, items, {
      inspirationImageUri: imageUri,
      excludeItemIds,
    });
  }, [fixtureId, items, imageUri, excludeItemIds]);

  const pieces = useMemo(
    () => (result ? getItemsByIds(result.itemIds) : []),
    [result, getItemsByIds],
  );

  const onSwitchVibe = useCallback(() => {
    if (!result) return;
    setJustWorn(false);
    setJustSaved(false);
    setExcludeItemIds((current) => [
      ...new Set([...current, ...result.itemIds]),
    ]);
  }, [result]);

  const onWear = async () => {
    if (!result || result.itemIds.length === 0) return;
    setBusy('wear');
    try {
      const now = new Date().toISOString();
      const outfit = {
        id: `outfit-${Date.now()}`,
        name: `Vibe · ${result.title}`,
        occasion: result.vibeLabels[0] ?? 'Casual',
        itemIds: result.itemIds,
        createdAt: now,
        updatedAt: now,
      };
      await markOutfitWorn(outfit.id, outfit);
      setJustWorn(true);
    } finally {
      setBusy('idle');
    }
  };

  const onSave = async () => {
    if (!result || result.itemIds.length === 0) return;
    setBusy('save');
    try {
      const now = new Date().toISOString();
      await addOutfit({
        id: `outfit-${Date.now()}`,
        name: `Vibe · ${result.title}`,
        occasion: result.vibeLabels[0] ?? 'Casual',
        itemIds: result.itemIds,
        createdAt: now,
        updatedAt: now,
      });
      setJustSaved(true);
    } finally {
      setBusy('idle');
    }
  };

  if (!result) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Inspiration not found</Text>
        <Button label="Back to Vibe Match" onPress={() => router.back()} />
      </View>
    );
  }

  const confidencePct = Math.round(result.confidence * 100);

  return (
    <>
      <Stack.Screen options={{ title: 'Your version' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.compare}>
          <View style={styles.panel}>
            <Text variant="caption" color={colors.muted}>
              Inspiration
            </Text>
            <Image
              source={{ uri: result.inspirationImageUri }}
              style={styles.panelImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.panel}>
            <Text variant="caption" color={colors.muted}>
              Your version
            </Text>
            <View style={styles.mosaic}>
              {pieces.slice(0, 4).map((item) => (
                <Image
                  key={item.id}
                  source={{ uri: item.imageUri }}
                  style={styles.tile}
                  contentFit="cover"
                />
              ))}
              {pieces.length === 0 ? <View style={styles.tile} /> : null}
            </View>
            <Text variant="caption" color={colors.primary}>
              Avatar preview in a later phase — mosaic for now
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          <Text variant="title">{result.title}</Text>
          <Text variant="body" color={colors.muted}>
            {result.summary}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.pill}>
              <Text variant="caption" color={colors.primary}>
                {confidencePct}% closet fit
              </Text>
            </View>
            {result.hackCount > 0 ? (
              <View style={[styles.pill, styles.pillAccent]}>
                <Text variant="caption" color={colors.accent}>
                  {result.hackCount} hack{result.hackCount === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}
            {result.gapCount > 0 ? (
              <View style={styles.pill}>
                <Text variant="caption" color={colors.muted}>
                  {result.gapCount} gap{result.gapCount === 1 ? '' : 's'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.mapList}>
          <Text variant="caption" color={colors.muted}>
            Mapped elements
          </Text>
          {result.mappings.map((row) => (
            <Pressable
              key={`${row.role}-${row.inspirationLabel}`}
              style={styles.mapRow}
              disabled={!row.item}
              onPress={() =>
                row.item ? router.push(`/item/${row.item.id}`) : undefined
              }
            >
              {row.item ? (
                <Image
                  source={{ uri: row.item.imageUri }}
                  style={styles.mapThumb}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.mapThumb, styles.mapThumbEmpty]}>
                  <Ionicons name="ellipse-outline" size={18} color={colors.muted} />
                </View>
              )}
              <View style={styles.mapMeta}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {row.inspirationLabel}
                  {row.item ? ` → ${row.item.name}` : ''}
                </Text>
                <Text variant="caption" color={statusColor(row.status)}>
                  {statusLabel(row.status)}
                  {row.note ? ` · ${row.note}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Button
          label={
            busy === 'wear'
              ? 'Saving…'
              : justWorn
                ? 'Logged as worn'
                : 'Wear This'
          }
          onPress={onWear}
          disabled={busy !== 'idle' || result.itemIds.length === 0}
        />
        <Button
          label={
            busy === 'save'
              ? 'Saving…'
              : justSaved
                ? 'Saved look'
                : 'Save Look'
          }
          variant="secondary"
          onPress={onSave}
          disabled={busy !== 'idle' || result.itemIds.length === 0}
        />
        <Button
          label="Switch the vibe"
          variant="ghost"
          onPress={onSwitchVibe}
          disabled={busy !== 'idle'}
        />
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
  compare: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  panel: {
    flex: 1,
    gap: spacing.xs,
  },
  panelImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceMuted,
  },
  mosaic: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: radii.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.surfaceMuted,
  },
  tile: {
    width: '50%',
    height: '50%',
    backgroundColor: colors.surfaceMuted,
  },
  summary: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  pillAccent: {
    backgroundColor: colors.accentSoft,
  },
  mapList: {
    gap: spacing.sm,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  mapThumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  mapThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMeta: {
    flex: 1,
    gap: 2,
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
