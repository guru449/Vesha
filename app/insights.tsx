import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { computeWardrobeInsights } from '@/lib/insights';

function StatRow({
  label,
  value,
  bar,
}: {
  label: string;
  value: string;
  bar?: number;
}) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statRowTop}>
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="caption" color={colors.muted}>
          {value}
        </Text>
      </View>
      {typeof bar === 'number' ? (
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.max(bar, 6)}%` }]} />
        </View>
      ) : null}
    </View>
  );
}

export default function InsightsScreen() {
  const { items, wearHistory } = useApp();
  const insets = useSafeAreaInsets();
  const insights = useMemo(
    () => computeWardrobeInsights(items, wearHistory),
    [items, wearHistory],
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Insights' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text variant="title">Wardrobe insights</Text>
          <Text variant="body" color={colors.muted}>
            See what you wear most — and what still needs a turn.
          </Text>
          <Pressable
            style={styles.healthLink}
            onPress={() => router.push('/health')}
          >
            <Text variant="bodyMedium" color={colors.primary}>
              Open Wardrobe Health →
            </Text>
          </Pressable>
        </Animated.View>

        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text variant="title">{insights.totalPieces}</Text>
            <Text variant="caption" color={colors.muted}>
              Pieces
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text variant="title">{insights.totalWears}</Text>
            <Text variant="caption" color={colors.muted}>
              Wears logged
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text variant="title">{insights.categories.length}</Text>
            <Text variant="caption" color={colors.muted}>
              Categories
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="subtitle">Most worn</Text>
          {insights.mostWorn.length === 0 ? (
            <Text variant="body" color={colors.muted}>
              Mark outfits as worn to unlock this.
            </Text>
          ) : (
            insights.mostWorn.map((stat) => (
              <Pressable
                key={stat.item.id}
                style={styles.itemRow}
                onPress={() => router.push(`/item/${stat.item.id}`)}
              >
                <Image
                  source={{ uri: stat.item.imageUri }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.itemMeta}>
                  <Text variant="bodyMedium" numberOfLines={1}>
                    {stat.item.name}
                  </Text>
                  <Text variant="caption" color={colors.muted}>
                    Worn {stat.wearCount}×
                    {stat.lastWornAt
                      ? ` · last ${new Date(stat.lastWornAt).toLocaleDateString()}`
                      : ''}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text variant="subtitle">Needs love</Text>
          <Text variant="caption" color={colors.muted}>
            Rarely or never worn pieces
          </Text>
          {insights.neglected.map((stat) => (
            <Pressable
              key={stat.item.id}
              style={styles.itemRow}
              onPress={() => router.push(`/item/${stat.item.id}`)}
            >
              <Image
                source={{ uri: stat.item.imageUri }}
                style={styles.thumb}
                contentFit="cover"
              />
              <View style={styles.itemMeta}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {stat.item.name}
                </Text>
                <Text variant="caption" color={colors.muted}>
                  {stat.wearCount === 0
                    ? 'Never worn yet'
                    : `Only worn ${stat.wearCount}×`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="subtitle">Category mix</Text>
          {insights.categories.map((cat) => (
            <StatRow
              key={cat.category}
              label={cat.category}
              value={`${cat.count} · ${cat.percent}%`}
              bar={cat.percent}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="subtitle">Top colors</Text>
          <View style={styles.colorWrap}>
            {insights.topColors.map((entry) => (
              <View key={entry.color} style={styles.colorChip}>
                <Text variant="caption" color={colors.inkSoft}>
                  {entry.color} · {entry.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
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
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  healthLink: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  summary: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  section: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  statRow: {
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  colorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorChip: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
