import AsyncStorage from '@react-native-async-storage/async-storage';

import { seedSocialPosts, type SocialPost } from '@/data/socialFeed';

const POSTS_KEY = 'vesha.socialPosts';
const LIKES_KEY = 'vesha.socialLikes';

export async function loadSocialPosts(): Promise<SocialPost[]> {
  try {
    const raw = await AsyncStorage.getItem(POSTS_KEY);
    const extra: SocialPost[] = raw ? JSON.parse(raw) : [];
    const byId = new Map<string, SocialPost>();
    for (const post of [...extra, ...seedSocialPosts]) {
      if (!byId.has(post.id)) byId.set(post.id, post);
    }
    return [...byId.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return seedSocialPosts;
  }
}

export async function publishLookToFeed(input: {
  authorName: string;
  caption: string;
  imageUri: string;
  vibeLabels: string[];
  fixtureId: string;
  itemIds: string[];
}): Promise<SocialPost> {
  const post: SocialPost = {
    id: `post-you-${Date.now()}`,
    authorName: input.authorName || 'You',
    authorHandle: '@you',
    caption: input.caption,
    imageUri: input.imageUri,
    vibeLabels: input.vibeLabels,
    fixtureId: input.fixtureId,
    itemIds: input.itemIds,
    createdAt: new Date().toISOString(),
    source: 'you',
  };
  const existing = await loadSocialPosts();
  const next = [post, ...existing.filter((row) => row.id !== post.id)];
  // Persist only user posts; seeds stay in code.
  const userPosts = next.filter((row) => row.source === 'you');
  await AsyncStorage.setItem(POSTS_KEY, JSON.stringify(userPosts));
  return post;
}

export async function loadSocialLikes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(LIKES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleSocialLike(id: string): Promise<string[]> {
  const current = await loadSocialLikes();
  const next = current.includes(id)
    ? current.filter((row) => row !== id)
    : [...current, id];
  await AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next));
  return next;
}

/** Pick a vibe fixture that best matches outfit occasion/labels. */
export function fixtureIdForOccasion(occasion?: string): string {
  const o = (occasion || '').toLowerCase();
  if (/evening|party|wedding|date/.test(o)) return 'evening-slip';
  if (/work|office|smart/.test(o)) return 'smart-work';
  return 'street-baggy';
}
