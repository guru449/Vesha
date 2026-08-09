import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  Alert,
  Platform,
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

export default function OutfitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { outfits, getItemsForOutfit, deleteOutfit, markOutfitWorn } = useApp();
  const insets = useSafeAreaInsets();

  const outfit = useMemo(
    () => outfits.find((item) => item.id === id),
    [outfits, id],
  );
  const pieces = outfit ? getItemsForOutfit(outfit) : [];

  if (!outfit) {
    return (
      <View style={styles.missing}>
        <Text variant="subtitle">Outfit not found</Text>
        <Button label="Back to outfits" onPress={() => router.replace('/(tabs)/outfits')} />
      </View>
    );
  }

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
    await markOutfitWorn(outfit.id);
  };

  return (
    <>
      <Stack.Screen options={{ title: outfit.name }} />
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
            label="Edit outfit"
            onPress={() =>
              router.push({
                pathname: '/outfit/create',
                params: { outfitId: outfit.id },
              })
            }
          />
          <Button
            label={outfit.lastWornAt ? 'Mark worn again' : 'Mark as worn'}
            variant="secondary"
            onPress={onMarkWorn}
          />
          <Button label="Delete outfit" variant="danger" onPress={onDelete} />
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
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
});
