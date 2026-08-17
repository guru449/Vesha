import type { ClothingItem } from '@/data/types';
import { diagnoseWardrobeGaps } from '@/lib/stylist';

export type ClosetStep = {
  id: string;
  label: string;
  done: boolean;
};

export type TodayOnboarding = {
  status: 'empty' | 'building' | 'ready';
  headline: string;
  body: string;
  steps: ClosetStep[];
  /** Enough categories to assemble at least one look */
  canSuggest: boolean;
  pieceCount: number;
  /** Soft tip when suggestions work but closet is still small */
  varietyTip: string | null;
};

const VARIETY_TARGET = 6;

function categoryCounts(items: ClothingItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.attributes.category] =
        (acc[item.attributes.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

/**
 * First-run / small-closet guidance for the Today stylist.
 * Pure helper — safe to unit-test without UI.
 */
export function getTodayOnboarding(
  items: ClothingItem[],
  occasion = 'Casual',
): TodayOnboarding {
  const pieceCount = items.length;
  const counts = categoryCounts(items);
  const hasDress = (counts.Dresses || 0) > 0;
  const hasTop = (counts.Tops || 0) > 0;
  const hasBottom = (counts.Bottoms || 0) > 0;
  const hasShoes = (counts.Shoes || 0) > 0;

  const steps: ClosetStep[] = [
    {
      id: 'top',
      label: 'A top or dress',
      done: hasTop || hasDress,
    },
    {
      id: 'bottom',
      label: 'Bottoms (skip if you only wear dresses)',
      done: hasBottom || hasDress,
    },
    {
      id: 'shoes',
      label: 'Shoes',
      done: hasShoes,
    },
    {
      id: 'variety',
      label: `A few more pieces (${Math.min(pieceCount, VARIETY_TARGET)}/${VARIETY_TARGET})`,
      done: pieceCount >= VARIETY_TARGET,
    },
  ];

  const gaps = diagnoseWardrobeGaps({ occasion, items });
  const canSuggest = gaps.missing.length === 0 && pieceCount > 0;

  if (pieceCount === 0) {
    return {
      status: 'empty',
      headline: 'Start your closet',
      body: 'Add a few pieces and Today can suggest what to wear.',
      steps,
      canSuggest: false,
      pieceCount,
      varietyTip: null,
    };
  }

  if (!canSuggest) {
    return {
      status: 'building',
      headline: 'Almost ready to style',
      body: gaps.message,
      steps,
      canSuggest: false,
      pieceCount,
      varietyTip: null,
    };
  }

  if (pieceCount < VARIETY_TARGET) {
    return {
      status: 'building',
      headline: 'Ready for first suggestions',
      body: 'You have enough for a look. Add a bit more for better variety.',
      steps,
      canSuggest: true,
      pieceCount,
      varietyTip:
        'Suggestions work with a small closet — more pieces mean more options.',
    };
  }

  return {
    status: 'ready',
    headline: 'Your closet is ready',
    body: 'Pick an occasion and get looks from what you already own.',
    steps,
    canSuggest: true,
    pieceCount,
    varietyTip: null,
  };
}
