import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { colors, radii, spacing } from '@/constants/theme';
import { createGroupEvent, listGroupEvents } from '@/lib/groupStore';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const [tick, setTick] = useState(0);
  const list = useMemo(() => {
    void tick;
    return listGroupEvents();
  }, [tick]);

  const onCreate = () => {
    const created = createGroupEvent();
    setTick((n) => n + 1);
    router.push(`/groups/${created.id}`);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Group outings' }} />
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
            Coordinate without cloning
          </Text>
          <Text variant="title">Group matching</Text>
          <Text variant="body" color={colors.muted}>
            Shared vibe and dress code — each person gets a personal Wear This
            that fits the group story. Guest closets stay privacy-scoped demos.
          </Text>
        </View>

        <Button label="Create outing" onPress={onCreate} />

        {list.map((event) => (
          <Pressable
            key={event.id}
            style={styles.card}
            onPress={() => router.push(`/groups/${event.id}`)}
          >
            <View style={styles.cardTop}>
              <Text variant="bodyMedium">{event.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </View>
            <Text variant="caption" color={colors.muted}>
              {event.dateLabel} · {event.dressCode}
            </Text>
            <Text variant="body" color={colors.muted}>
              {event.vibe} · {event.members.length} people
            </Text>
            <View style={styles.paletteRow}>
              {event.palette.slice(0, 4).map((swatch) => (
                <View key={swatch} style={styles.swatch}>
                  <Text variant="caption" color={colors.primary}>
                    {swatch}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  swatch: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
