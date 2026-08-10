import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import {
  analyzeWardrobeHealth,
  type HealthFinding,
  type HealthSeverity,
} from '@/lib/wardrobeHealth';

const SEVERITY_STYLES: Record<
  HealthSeverity,
  { bg: string; accent: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  good: {
    bg: colors.primaryMist,
    accent: colors.success,
    icon: 'checkmark-circle',
  },
  info: {
    bg: colors.surface,
    accent: colors.primary,
    icon: 'sparkles',
  },
  warning: {
    bg: colors.accentSoft,
    accent: colors.accent,
    icon: 'alert-circle',
  },
};

function FindingCard({
  finding,
  itemsById,
  index,
}: {
  finding: HealthFinding;
  itemsById: Map<string, { id: string; name: string; imageUri: string }>;
  index: number;
}) {
  const tone = SEVERITY_STYLES[finding.severity];
  const previewIds = (finding.itemIds || []).slice(0, 4);

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 60).duration(380)}
      style={[styles.finding, { backgroundColor: tone.bg }]}
    >
      <View style={styles.findingTop}>
        <Ionicons name={tone.icon} size={22} color={tone.accent} />
        {finding.metricLabel ? (
          <View style={[styles.metricChip, { borderColor: tone.accent }]}>
            <Text variant="caption" color={tone.accent}>
              {finding.metricLabel}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="subtitle">{finding.title}</Text>
      <Text variant="body" color={colors.inkSoft}>
        {finding.detail}
      </Text>
      {previewIds.length > 0 ? (
        <View style={styles.previewRow}>
          {previewIds.map((id) => {
            const item = itemsById.get(id);
            if (!item) return null;
            return (
              <Pressable
                key={id}
                onPress={() => router.push(`/item/${id}`)}
                style={styles.previewTap}
              >
                <Image
                  source={{ uri: item.imageUri }}
                  style={styles.previewThumb}
                  contentFit="cover"
                />
              </Pressable>
            );
          })}
          {(finding.itemIds?.length || 0) > 4 ? (
            <View style={styles.moreChip}>
              <Text variant="caption" color={colors.muted}>
                +{(finding.itemIds?.length || 0) - 4}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function WardrobeHealthScreen() {
  const { items, wearHistory, outfits } = useApp();
  const insets = useSafeAreaInsets();

  const report = useMemo(
    () => analyzeWardrobeHealth(items, wearHistory, outfits),
    [items, wearHistory, outfits],
  );

  const itemsById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items],
  );

  const scoreColor =
    report.score >= 70
      ? colors.success
      : report.score >= 50
        ? colors.primary
        : colors.accent;

  return (
    <>
      <Stack.Screen options={{ title: 'Wardrobe Health' }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(420)} style={styles.hero}>
          <Text variant="caption" color={colors.primary}>
            AI wardrobe check
          </Text>
          <Text variant="title">Wardrobe Health</Text>
          <Text variant="body" color={colors.muted}>
            {report.summary}
          </Text>

          <View style={styles.scoreBlock}>
            <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
              <Text variant="hero" color={scoreColor}>
                {report.score}
              </Text>
              <Text variant="caption" color={colors.muted}>
                / 100
              </Text>
            </View>
            <View style={styles.scoreMeta}>
              <Text variant="subtitle">{report.grade}</Text>
              <Text variant="caption" color={colors.muted}>
                Based on wear history, color pairing, and closet gaps.
              </Text>
              <Text variant="caption" color={colors.muted}>
                {report.findings.length} finding
                {report.findings.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <Text variant="subtitle">Findings</Text>
          <Text variant="caption" color={colors.muted}>
            Utilization · versatility · dormant pieces · gaps
          </Text>
          {report.findings.map((finding, index) => (
            <FindingCard
              key={finding.id}
              finding={finding}
              itemsById={itemsById}
              index={index}
            />
          ))}
        </View>

        <Pressable
          style={styles.cta}
          onPress={() => router.push('/(tabs)/today')}
        >
          <Text variant="bodyMedium" color={colors.primary}>
            Put idle pieces to work on Today →
          </Text>
        </Pressable>
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
  hero: {
    gap: spacing.sm,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  scoreRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  scoreMeta: {
    flex: 1,
    gap: 4,
  },
  section: {
    gap: spacing.sm,
  },
  finding: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  findingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricChip: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  previewTap: {
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  moreChip: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
