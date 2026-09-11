import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OutfitShareCard } from '@/components/outfits/OutfitShareCard';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';
import { shareOutfitCard } from '@/lib/shareOutfit';
import { fixtureIdForOccasion, publishLookToFeed } from '@/lib/social';

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    outfits,
    getItemsForOutfit,
    deleteOutfit,
    markOutfitWorn,
    updateOutfit,
    user,
  } = useApp();
  const insets = useSafeAreaInsets();
  const shareRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [wearing, setWearing] = useState(false);
  const [justWorn, setJustWorn] = useState(false);

  const outfit = useMemo(
    () => outfits.find((item) => item.id === id),
    [outfits, id],
  );
  const pieces = outfit ? getItemsForOutfit(outfit) : [];

  if (!outfit) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Outfit not found</Text>
        <Button
          label="Back to outfits"
          onPress={() => router.replace('/(tabs)/outfits')}
        />
      </View>
    );
  }

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const goEdit = () => {
    router.push({
      pathname: '/outfit/create',
      params: { outfitId: outfit.id },
    });
  };

  const onDelete = async () => {
    const message = `Delete “${outfit.name}”?`;
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(message) : false;
      if (!ok) return;
      await deleteOutfit(outfit.id);
      router.replace('/(tabs)/outfits');
      return;
    }

    Alert.alert('Delete outfit', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteOutfit(outfit.id);
          router.replace('/(tabs)/outfits');
        },
      },
    ]);
  };

  const onMarkWorn = async () => {
    setWearing(true);
    try {
      await markOutfitWorn(outfit.id);
      setJustWorn(true);
    } finally {
      setWearing(false);
    }
  };

  const onTogglePin = async () => {
    setPinning(true);
    try {
      await updateOutfit(outfit.id, { isPinned: !outfit.isPinned });
    } finally {
      setPinning(false);
    }
  };

  const onShare = async () => {
    setSharing(true);
    try {
      const result = await shareOutfitCard({
        viewRef: shareRef,
        outfit,
        pieces,
      });
      if (result === 'unavailable') {
        showMessage(
          'Sharing unavailable',
          'Sharing isn’t available on this device.',
        );
      }
    } catch (error) {
      showMessage(
        'Could not share',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSharing(false);
    }
  };

  const onPostToCommunity = async () => {
    if (!outfit || pieces.length === 0) return;
    setPosting(true);
    try {
      await publishLookToFeed({
        authorName: user?.name ?? 'You',
        caption: `${outfit.name}${outfit.occasion ? ` · ${outfit.occasion}` : ''}`,
        imageUri: pieces[0]!.imageUri,
        vibeLabels: [
          ...(outfit.occasion ? [outfit.occasion.toLowerCase()] : []),
          'closet',
        ],
        fixtureId: fixtureIdForOccasion(outfit.occasion),
        itemIds: outfit.itemIds,
      });
      setPosted(true);
    } catch (error) {
      showMessage(
        'Could not post',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: outfit.name,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                outfit.isPinned ? 'Unpin look' : 'Pin look'
              }
              disabled={pinning}
              onPress={onTogglePin}
              hitSlop={10}
              style={styles.headerIcon}
            >
              <Ionicons
                name={outfit.isPinned ? 'star' : 'star-outline'}
                size={22}
                color={outfit.isPinned ? colors.primary : colors.inkSoft}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroMosaic}>
          {pieces.slice(0, 4).map((item) => (
            <Image
              key={item.id}
              source={{ uri: item.imageUri }}
              style={styles.heroTile}
              contentFit="cover"
            />
          ))}
        </View>

        <View style={styles.header}>
          <Text variant="title">{outfit.name}</Text>
          <Text variant="body" color={colors.muted}>
            {outfit.isPinned ? 'Pinned · ' : ''}
            {outfit.occasion ? `${outfit.occasion} · ` : ''}
            {pieces.length} piece{pieces.length === 1 ? '' : 's'}
          </Text>
          {outfit.lastWornAt ? (
            <Text variant="caption" color={colors.primary}>
              Last worn {new Date(outfit.lastWornAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text variant="caption" color={colors.muted}>
            Pieces in this look
          </Text>
          {pieces.map((item) => (
            <Pressable
              key={item.id}
              style={styles.pieceRow}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={styles.pieceThumb}
                contentFit="cover"
              />
              <View style={styles.pieceMeta}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text variant="caption" color={colors.muted}>
                  {item.attributes.color} · {item.attributes.category}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            label={
              wearing
                ? 'Saving…'
                : justWorn
                  ? 'Logged for today'
                  : outfit.lastWornAt
                    ? 'Re-wear'
                    : 'Wear today'
            }
            onPress={onMarkWorn}
            disabled={wearing}
          />
          <Button
            label={sharing ? 'Preparing…' : 'Share look'}
            variant="secondary"
            onPress={onShare}
            disabled={sharing || pieces.length === 0}
          />
          <Button
            label={
              posting
                ? 'Posting…'
                : posted
                  ? 'Posted to Community'
                  : 'Post to Community'
            }
            variant="ghost"
            onPress={onPostToCommunity}
            disabled={posting || posted || pieces.length === 0}
          />
          {posted ? (
            <Pressable onPress={() => router.push('/social')} hitSlop={8}>
              <Text variant="caption" color={colors.primary} center>
                Open Community feed
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.quietRow}>
            <Pressable onPress={goEdit} hitSlop={8}>
              <Text variant="bodyMedium" color={colors.primary}>
                Edit
              </Text>
            </Pressable>
            <Text variant="body" color={colors.borderStrong}>
              ·
            </Text>
            <Pressable onPress={onDelete} hitSlop={8}>
              <Text variant="bodyMedium" color={colors.danger}>
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Off-screen share card for view-shot capture */}
      <View style={styles.shareHost} pointerEvents="none">
        <OutfitShareCard ref={shareRef} outfit={outfit} pieces={pieces} />
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
  heroMosaic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 220,
    borderRadius: radii.xl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  heroTile: {
    width: '50%',
    height: '50%',
  },
  header: {
    gap: 4,
  },
  headerIcon: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  section: {
    gap: spacing.sm,
  },
  pieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  pieceThumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  pieceMeta: {
    flex: 1,
    gap: 2,
  },
  actions: {
    gap: spacing.sm,
  },
  quietRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  shareHost: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 1,
  },
});
