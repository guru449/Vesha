import type { ClothingCategory } from '@/constants/theme';

/** Build a short wardrobe name from color + category (local heuristic assist). */
export function nameFromColorAndCategory(
  color: string,
  category: ClothingCategory,
): string {
  const c = color && color !== 'Unknown' ? color : 'New';
  switch (category) {
    case 'Tops':
      return `${c} Top`;
    case 'Bottoms':
      return `${c} Trousers`;
    case 'Dresses':
      return `${c} Dress`;
    case 'Shoes':
      return `${c} Shoes`;
    case 'Jewelry':
      return `${c} Jewelry`;
    case 'Accessories':
      return `${c} Accessory`;
    default:
      return `${c} piece`;
  }
}
