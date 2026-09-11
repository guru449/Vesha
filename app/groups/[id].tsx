import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutfitAvatar } from '@/components/avatar/OutfitAvatar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { proposeGroupLooks } from '@/lib/groupMatch';
import { getGroupEvent } from '@/lib/groupStore';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, outfits, wearHistory, user, markOutfitWorn, getItemsByIds } =
    useApp();
  const insets = useSafeAreaInsets();
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const [wornMember, setWornMember] = useState<string | null>(null);

  const event = getGroupEvent(id ?? '');

  const proposals = useMemo(() => {
    if (!event) return [];
    return proposeGroupLooks({
      event,
      yourCloset: items,
      yourOutfits: outfits,
      wearHistory,
      stylePreferences: user?.stylePreferences ?? [],
    });
  }, [event, items, outfits, wearHistory, user?.stylePreferences]);

  if (!event) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Outing not found</Text>
        <Button label="Back to groups" onPress={() => router.replace('/groups')} />
      </View>
    );
  }

  const wearForYou = async (itemIds: string[], title: string) => {
    setBusyMember('you');
    try {
      const now = new Date().toISOString();
      await markOutfitWorn(`outfit-${Date.now()}`, {
        id: `outfit-${Date.now()}`,
        name: `${event.title} · ${title}`,
        occasion: event.occasion,
        itemIds,
        createdAt: now,
        updatedAt: now,
      });
      setWornMember('you');
    } finally {
      setBusyMember(null);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: event.title }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text variant="caption" color={colors.primary}>
            {event.dateLabel}
          </Text>
          <Text variant="title">{event.title}</Text>
          <Text variant="body" color={colors.muted}>
            {event.vibe} · {event.dressCode}
          </Text>
          <View style={styles.paletteRow}>
            {event.palette.map((swatch) => (
              <View key={swatch} style={styles.swatch}>
                <Text variant="caption" color={colors.primary}>
                  {swatch}
                </Text>
              </View>
            ))}
          </View>
          <Text variant="caption" color={colors.muted}>
            Guest closets are demo subsets — real sharing stays privacy-scoped.
          </Text>
        </View>

        {proposals.map((proposal) => {
          const pieces = getItemsByIds(proposal.itemIds);
          const isYou = proposal.member.role === 'you';
          return (
            <View key={proposal.member.id} style={styles.card}>
              <View style={styles.cardHead}>
                <View style={styles.memberBubble}>
                  <Text variant="caption" color={colors.primary}>
                    {proposal.member.name.slice(0, 1)}
                  </Text>
                </View>
                <View style={styles.memberMeta}>
                  <Text variant="bodyMedium">
                    {proposal.member.name}
                    {isYou ? ' · you' : ''}
                  </Text>
                  <Text variant="caption" color={colors.muted}>
                    {proposal.formalityNote}
                  </Text>
                </View>
              </View>

              <OutfitAvatar
                pieces={pieces}
                avatarUri={isYou ? user?.avatarUri : undefined}
                heightCm={isYou ? user?.heightCm : undefined}
                style={styles.avatar}
              />

              <Text variant="bodyMedium">{proposal.title}</Text>
              <Text variant="body" color={colors.muted}>
                {proposal.reason}
              </Text>
              <View style={styles.note}>
                <Ionicons
                  name="color-palette-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text variant="caption" color={colors.primary}>
                  {proposal.paletteNote}
                </Text>
              </View>

              {isYou ? (
                <Button
                  label={
                    busyMember === 'you'
                      ? 'Logging…'
                      : wornMember === 'you'
                        ? 'Logged for you'
                        : 'Wear This'
                  }
                  onPress={() => wearForYou(proposal.itemIds, proposal.title)}
                  disabled={
                    Boolean(busyMember) ||
                    wornMember === 'you' ||
                    proposal.itemIds.length === 0
                  }
                />
              ) : (
                <Text variant="caption" color={colors.muted}>
                  Guest preview — they wear from their own closet in a real
                  group invite.
                </Text>
              )}
            </View>
          );
        })}

        <Button
          label="Back to groups"
          variant="secondary"
          onPress={() => router.back()}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { gap: spacing.sm },
  paletteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatch: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberMeta: { flex: 1, gap: 1 },
  avatar: { borderRadius: radii.md },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.md,
    padding: spacing.sm,
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
