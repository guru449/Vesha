import type { ClothingItem } from '@/data/types';
import {
  getVibeFixture,
  uploadStreetTemplate,
  type VibeElementSpec,
  type VibeFixture,
} from '@/data/vibeFixtures';
import { colorsWorkTogether } from '@/lib/wardrobeHealth';

export type VibeMapStatus = 'exact' | 'hack' | 'gap';

export type VibeMappedElement = {
  role: VibeElementSpec['role'];
  inspirationLabel: string;
  status: VibeMapStatus;
  /** Closet piece when matched or hacked */
  item?: ClothingItem;
  /** Confidence 0–1 for this mapping */
  confidence: number;
  /** Shown when status is hack or gap */
  note?: string;
  optional?: boolean;
};

export type VibeMatchResult = {
  fixtureId: string;
  title: string;
  vibeLabels: string[];
  inspirationImageUri: string;
  mappings: VibeMappedElement[];
  itemIds: string[];
  /** Overall fit 0–1 */
  confidence: number;
  gapCount: number;
  hackCount: number;
  summary: string;
};

function haystack(item: ClothingItem): string {
  return [
    item.name,
    item.attributes.category,
    item.attributes.color,
    item.attributes.style,
    item.attributes.material,
    item.attributes.occasion,
    item.attributes.pattern,
  ]
    .join(' ')
    .toLowerCase();
}

function scoreElement(
  element: VibeElementSpec,
  item: ClothingItem,
): { score: number; exactHits: number } {
  if (item.attributes.category !== element.category) {
    return { score: -100, exactHits: 0 };
  }
  const text = haystack(item);
  let score = 1;
  let exactHits = 0;
  for (const keyword of element.exactKeywords) {
    if (text.includes(keyword.toLowerCase())) {
      score += 5;
      exactHits += 1;
    }
  }
  for (const keyword of element.keywords) {
    if (text.includes(keyword.toLowerCase())) score += 2;
  }
  if (
    /baggy|oversized|relaxed|wide|crew|slip|sneaker|boot|tote|hoop/.test(
      item.attributes.style.toLowerCase(),
    )
  ) {
    score += 1;
  }
  return { score, exactHits };
}

function pickForElement(
  element: VibeElementSpec,
  closet: ClothingItem[],
  usedIds: Set<string>,
  excludeIds: Set<string>,
): { item?: ClothingItem; score: number; exactHits: number } {
  const candidates = closet
    .filter((item) => !usedIds.has(item.id) && !excludeIds.has(item.id))
    .map((item) => {
      const scored = scoreElement(element, item);
      return { item, ...scored };
    })
    .filter((row) => row.score > -50)
    .sort((a, b) => b.score - a.score || b.exactHits - a.exactHits);

  return candidates[0] ?? { score: -100, exactHits: 0 };
}

/**
 * Match a vibe fixture (or upload template) against the user's closet.
 * Never dead-ends: missing pieces become silhouette hacks when possible.
 */
export function matchVibeToCloset(options: {
  fixture: VibeFixture;
  closet: ClothingItem[];
  inspirationImageUri?: string;
  /** Item ids to avoid (for Switch the vibe) */
  excludeItemIds?: string[];
}): VibeMatchResult {
  const { fixture, closet, inspirationImageUri, excludeItemIds = [] } =
    options;
  const excludeIds = new Set(excludeItemIds);
  const usedIds = new Set<string>();
  const mappings: VibeMappedElement[] = [];

  for (const element of fixture.elements) {
    const pick = pickForElement(element, closet, usedIds, excludeIds);
    const isExact = Boolean(pick.item && pick.exactHits > 0);

    if (isExact && pick.item) {
      usedIds.add(pick.item.id);
      mappings.push({
        role: element.role,
        inspirationLabel: element.label,
        status: 'exact',
        item: pick.item,
        confidence: Math.min(0.95, 0.6 + pick.exactHits * 0.1 + pick.score * 0.02),
        optional: element.optional,
      });
      continue;
    }

    if (pick.item && pick.score > 0) {
      usedIds.add(pick.item.id);
      mappings.push({
        role: element.role,
        inspirationLabel: element.label,
        status: 'hack',
        item: pick.item,
        confidence: Math.min(0.75, 0.35 + pick.score * 0.04),
        note: element.silhouetteHack,
        optional: element.optional,
      });
      continue;
    }

    // Last resort: any piece in the category
    const fallback = closet
      .filter(
        (item) =>
          item.attributes.category === element.category &&
          !usedIds.has(item.id) &&
          !excludeIds.has(item.id),
      )
      .sort((a, b) => {
        // Prefer neutrals that play with others already chosen
        const chosen = [...usedIds]
          .map((id) => closet.find((row) => row.id === id))
          .filter(Boolean) as ClothingItem[];
        const scoreA = chosen.some((c) =>
          colorsWorkTogether(c.attributes.color, a.attributes.color),
        )
          ? 1
          : 0;
        const scoreB = chosen.some((c) =>
          colorsWorkTogether(c.attributes.color, b.attributes.color),
        )
          ? 1
          : 0;
        return scoreB - scoreA;
      })[0];

    if (fallback) {
      usedIds.add(fallback.id);
      mappings.push({
        role: element.role,
        inspirationLabel: element.label,
        status: 'hack',
        item: fallback,
        confidence: 0.4,
        note: element.silhouetteHack,
        optional: element.optional,
      });
      continue;
    }

    mappings.push({
      role: element.role,
      inspirationLabel: element.label,
      status: 'gap',
      confidence: 0,
      note: element.optional
        ? `${element.silhouetteHack} (optional)`
        : element.silhouetteHack,
      optional: element.optional,
    });
  }

  const itemIds = mappings
    .map((row) => row.item?.id)
    .filter((id): id is string => Boolean(id));

  const required = mappings.filter((row) => !row.optional);
  const exactCount = required.filter((row) => row.status === 'exact').length;
  const hackCount = mappings.filter((row) => row.status === 'hack').length;
  const gapCount = mappings.filter(
    (row) => row.status === 'gap' && !row.optional,
  ).length;

  const confidence =
    required.length === 0
      ? 0
      : Math.max(
          0.2,
          Math.min(
            0.98,
            (exactCount * 1 + (required.length - exactCount - gapCount) * 0.55) /
              required.length,
          ),
        );

  let summary: string;
  if (gapCount === 0 && hackCount === 0) {
    summary = 'You already own this vibe — wear your version tonight.';
  } else if (gapCount === 0) {
    summary = `Close match with ${hackCount} silhouette hack${hackCount === 1 ? '' : 's'}.`;
  } else {
    summary = `Your version covers most of it — ${gapCount} gap${gapCount === 1 ? '' : 's'} with hacks noted.`;
  }

  return {
    fixtureId: fixture.id,
    title: fixture.title,
    vibeLabels: fixture.vibeLabels,
    inspirationImageUri: inspirationImageUri || fixture.imageUri,
    mappings,
    itemIds,
    confidence,
    gapCount,
    hackCount,
    summary,
  };
}

export function resolveVibeFixture(
  fixtureId?: string | null,
): VibeFixture | undefined {
  if (!fixtureId) return undefined;
  if (fixtureId === uploadStreetTemplate.id) return uploadStreetTemplate;
  return getVibeFixture(fixtureId);
}

export function matchFixtureById(
  fixtureId: string,
  closet: ClothingItem[],
  opts?: { inspirationImageUri?: string; excludeItemIds?: string[] },
): VibeMatchResult | null {
  const fixture = resolveVibeFixture(fixtureId);
  if (!fixture) return null;
  return matchVibeToCloset({
    fixture,
    closet,
    inspirationImageUri: opts?.inspirationImageUri,
    excludeItemIds: opts?.excludeItemIds,
  });
}
