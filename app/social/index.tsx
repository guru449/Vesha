import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import type { SocialPost } from '@/data/socialFeed';
import {
  loadSocialLikes,
  loadSocialPosts,
  toggleSocialLike,
} from '@/lib/social';

export default function SocialFeedScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const [nextPosts, likes] = await Promise.all([
      loadSocialPosts(),
      loadSocialLikes(),
    ]);
    setPosts(nextPosts);
    setLikedIds(likes);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onLike = async (id: string) => {
    const next = await toggleSocialLike(id);
    setLikedIds(next);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Community' }} />
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
            Social inspiration
          </Text>
          <Text variant="title">Looks with a path home</Text>
          <Text variant="body" color={colors.muted}>
            Creator posts stay tied to vibes and garments. Like → Vibe Match
            recreates with your closet — not endless scroll for its own sake.
          </Text>
        </View>

        <Pressable
          style={styles.groupsCard}
          onPress={() => router.push('/groups')}
        >
          <View style={styles.groupsIcon}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.groupsMeta}>
            <Text variant="bodyMedium">Group outings</Text>
            <Text variant="caption" color={colors.muted}>
              Wedding, trip, coordinated palettes — personal Wear This each
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        {posts.map((post) => {
          const liked = likedIds.includes(post.id);
          return (
            <View key={post.id} style={styles.card}>
              <View style={styles.authorRow}>
                <View style={styles.avatarBubble}>
                  <Text variant="caption" color={colors.primary}>
                    {post.authorName.slice(0, 1)}
                  </Text>
                </View>
                <View style={styles.authorMeta}>
                  <Text variant="bodyMedium">{post.authorName}</Text>
                  <Text variant="caption" color={colors.muted}>
                    {post.authorHandle}
                    {post.source === 'you' ? ' · you' : ''}
                  </Text>
                </View>
              </View>
              <Image
                source={{ uri: post.imageUri }}
                style={styles.image}
                contentFit="cover"
              />
              <Text variant="body">{post.caption}</Text>
              <View style={styles.tags}>
                {post.vibeLabels.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text variant="caption" color={colors.primary}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.likeBtn}
                  onPress={() => onLike(post.id)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={18}
                    color={liked ? colors.accent : colors.primary}
                  />
                  <Text
                    variant="caption"
                    color={liked ? colors.accent : colors.primary}
                  >
                    {liked ? 'Liked' : 'Like'}
                  </Text>
                </Pressable>
                <Button
                  label="Vibe Match"
                  onPress={() =>
                    router.push({
                      pathname: '/vibe/result',
                      params: {
                        fixtureId: post.fixtureId,
                        imageUri: post.imageUri,
                      },
                    })
                  }
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.md },
  hero: { gap: spacing.sm },
  groupsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryMist,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  groupsIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupsMeta: { flex: 1, gap: 2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorMeta: { flex: 1, gap: 1 },
  image: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceMuted,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: colors.primaryMist,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
});
