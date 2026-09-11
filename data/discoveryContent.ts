import { vibeFixtures, type VibeFixture } from '@/data/vibeFixtures';

export type DiscoveryOccasion = {
  id: string;
  label: string;
  /** Maps to stylist occasion */
  stylistOccasion: string;
  blurb: string;
  /** Linked vibe fixture for inspiration + Vibe Match */
  fixtureId: string;
};

export type TrendingCollection = {
  id: string;
  title: string;
  subtitle: string;
  imageUri: string;
  tags: string[];
  fixtureId: string;
};

export const discoveryOccasions: DiscoveryOccasion[] = [
  {
    id: 'date-night',
    label: 'Date night',
    stylistOccasion: 'Evening',
    blurb: 'Soft elegance from what you already own.',
    fixtureId: 'evening-slip',
  },
  {
    id: 'brunch',
    label: 'Brunch',
    stylistOccasion: 'Brunch',
    blurb: 'Easy layers for late morning plans.',
    fixtureId: 'street-baggy',
  },
  {
    id: 'work',
    label: 'Office',
    stylistOccasion: 'Work',
    blurb: 'Polished looks that still feel like you.',
    fixtureId: 'smart-work',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    stylistOccasion: 'Evening',
    blurb: 'Guest-ready without buying something new.',
    fixtureId: 'evening-slip',
  },
  {
    id: 'travel',
    label: 'Vacation',
    stylistOccasion: 'Travel',
    blurb: 'Comfort-first outfits that photograph well.',
    fixtureId: 'street-baggy',
  },
  {
    id: 'festival',
    label: 'Festival',
    stylistOccasion: 'Evening',
    blurb: 'Color and texture from your closet.',
    fixtureId: 'evening-slip',
  },
];

export const trendingCollections: TrendingCollection[] = [
  {
    id: 'trend-fall',
    title: 'Fall layering',
    subtitle: 'Crews, trousers, boots — your closet edition',
    imageUri:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80',
    tags: ['fall', 'layering', 'work', 'smart'],
    fixtureId: 'smart-work',
  },
  {
    id: 'trend-summer',
    title: 'Summer ease',
    subtitle: 'Light fabrics and clean sneakers',
    imageUri:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80',
    tags: ['summer', 'casual', 'brunch', 'linen'],
    fixtureId: 'street-baggy',
  },
  {
    id: 'trend-festive',
    title: 'Festive nights',
    subtitle: 'Slip dresses, gold, and soft structure',
    imageUri:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=900&q=80',
    tags: ['festive', 'evening', 'wedding', 'elegant'],
    fixtureId: 'evening-slip',
  },
];

export function fixtureForDiscovery(
  fixtureId: string,
): VibeFixture | undefined {
  return vibeFixtures.find((row) => row.id === fixtureId);
}

/** Build a searchable haystack for NL discovery. */
export function discoverySearchHaystack(parts: string[]): string {
  return parts.filter(Boolean).join(' ').toLowerCase();
}
