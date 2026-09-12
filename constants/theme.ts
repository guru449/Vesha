/**
 * Vesha design system — black closet aesthetic.
 * Deep black surfaces, warm ivory ink, sage accent; the whole app shares the
 * palette with the wardrobe view so garments read like they hang in a real closet.
 */
export const colors = {
  bg: '#050505',
  bgElevated: '#0D0D0D',
  surface: '#141414',
  surfaceMuted: '#1E1E1E',
  ink: '#F4F2EC',
  inkSoft: '#C9CCC7',
  muted: '#8A8F8B',
  border: '#262626',
  borderStrong: '#3A3A3A',
  primary: '#3F9478',
  primaryDark: '#2F7A62',
  primarySoft: '#1B3A31',
  primaryMist: '#122620',
  accent: '#D99A70',
  accentSoft: '#3A2A1F',
  danger: '#E07A7A',
  dangerSoft: '#3A2020',
  success: '#5CB08E',
  overlay: 'rgba(0, 0, 0, 0.6)',
  white: '#FFFFFF',
  shadow: 'rgba(0, 0, 0, 0.5)',
} as const;

/** Wardrobe frame tones used by the Closet tab (dark wood + brass rail). */
export const closetWood = {
  frameLight: '#2A211B',
  frameDark: '#1B1613',
  edge: '#3B2E25',
  shelfLight: '#5A4636',
  cavity: '#0B0A09',
  railLight: '#D7C4A3',
  railDark: '#8C7350',
  hanger: '#C9B695',
  label: '#9A8F84',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  brand: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 34,
    letterSpacing: -0.5,
  },
  hero: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
} as const;

/** Fine-grained categories stored on items (AI + recommendations). */
export const categories = [
  'All',
  'Tops',
  'Bottoms',
  'Dresses',
  'Shoes',
  'Jewelry',
  'Accessories',
] as const;

export type Category = (typeof categories)[number];
export type ClothingCategory = Exclude<Category, 'All'>;

/**
 * Closet UI top-level buckets (Phase 1 IA).
 * Fine subtypes stay on the item; the grid only exposes these three.
 */
export const closetBuckets = [
  'All',
  'Clothing',
  'Footwear',
  'Accessories',
] as const;

export type ClosetBucket = (typeof closetBuckets)[number];

export function categoryToClosetBucket(
  category: ClothingCategory,
): Exclude<ClosetBucket, 'All'> {
  if (category === 'Shoes') return 'Footwear';
  if (category === 'Jewelry' || category === 'Accessories') return 'Accessories';
  return 'Clothing';
}

export function itemMatchesClosetBucket(
  category: ClothingCategory,
  bucket: ClosetBucket,
): boolean {
  if (bucket === 'All') return true;
  return categoryToClosetBucket(category) === bucket;
}
