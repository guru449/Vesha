/**
 * Vesha design system — soft sage closet aesthetic.
 * Calm, fashion-friendly, easy to scan on mobile.
 */
export const colors = {
  bg: '#F0F3F1',
  bgElevated: '#F7F9F8',
  surface: '#FFFFFF',
  surfaceMuted: '#E8EEEB',
  ink: '#1C2B26',
  inkSoft: '#3D4F48',
  muted: '#6B7C75',
  border: '#D9E2DD',
  borderStrong: '#B8C7BF',
  primary: '#2F6F5E',
  primaryDark: '#245648',
  primarySoft: '#D5E8E1',
  primaryMist: '#EAF3EF',
  accent: '#C17A52',
  accentSoft: '#F3E4DA',
  danger: '#B85C5C',
  dangerSoft: '#F5E3E3',
  success: '#3E8B6E',
  overlay: 'rgba(28, 43, 38, 0.45)',
  white: '#FFFFFF',
  shadow: 'rgba(28, 43, 38, 0.08)',
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
