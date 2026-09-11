import { vibeFixtures } from '@/data/vibeFixtures';

export type SocialPost = {
  id: string;
  authorName: string;
  authorHandle: string;
  caption: string;
  imageUri: string;
  vibeLabels: string[];
  /** Opens Phase 4 Vibe Match */
  fixtureId: string;
  /** Optional closet look ids when the post is from the signed-in user */
  itemIds?: string[];
  createdAt: string;
  source: 'creator' | 'you';
};

/**
 * Seed community posts — still garment/vibe tied, not endless social noise.
 */
export const seedSocialPosts: SocialPost[] = [
  {
    id: 'post-1',
    authorName: 'Maya Rao',
    authorHandle: '@maya.styles',
    caption: 'Soft street — oversized top energy without buying new denim.',
    imageUri: vibeFixtures[0]!.imageUri,
    vibeLabels: ['street', 'relaxed', 'casual'],
    fixtureId: 'street-baggy',
    createdAt: '2026-09-08T10:00:00Z',
    source: 'creator',
  },
  {
    id: 'post-2',
    authorName: 'Jordan Lee',
    authorHandle: '@jordan.wear',
    caption: 'Office calm: ivory + black + cognac boots.',
    imageUri: vibeFixtures[1]!.imageUri,
    vibeLabels: ['work', 'smart', 'polished'],
    fixtureId: 'smart-work',
    createdAt: '2026-09-07T14:00:00Z',
    source: 'creator',
  },
  {
    id: 'post-3',
    authorName: 'Priya N.',
    authorHandle: '@priya.notes',
    caption: 'Wedding guest slip — gold optional, silhouette first.',
    imageUri: vibeFixtures[2]!.imageUri,
    vibeLabels: ['evening', 'wedding', 'elegant'],
    fixtureId: 'evening-slip',
    createdAt: '2026-09-06T18:00:00Z',
    source: 'creator',
  },
];
