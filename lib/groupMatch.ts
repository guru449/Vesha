import type { ClothingItem, Outfit, WearHistoryEntry } from '@/data/types';
import {
  resolveMemberCloset,
  type GroupEvent,
  type GroupMember,
} from '@/data/groupFixtures';
import { colorsWorkTogether } from '@/lib/wardrobeHealth';
import { suggestOutfitsForToday } from '@/lib/stylist';

export type MemberLookProposal = {
  member: GroupMember;
  title: string;
  reason: string;
  itemIds: string[];
  paletteNote: string;
  formalityNote: string;
};

function colorHitsPalette(color: string, palette: string[]): boolean {
  const c = color.toLowerCase();
  return palette.some((p) => c.includes(p.toLowerCase()));
}

function scorePaletteFit(pieces: ClothingItem[], palette: string[]): number {
  if (!pieces.length) return 0;
  let hits = 0;
  for (const item of pieces) {
    if (colorHitsPalette(item.attributes.color, palette)) hits += 1;
    else if (
      pieces.some(
        (other) =>
          other.id !== item.id &&
          colorsWorkTogether(item.attributes.color, other.attributes.color),
      )
    ) {
      hits += 0.4;
    }
  }
  return hits / pieces.length;
}

/**
 * Propose coordinated (not identical) looks for each group member.
 */
export function proposeGroupLooks(options: {
  event: GroupEvent;
  yourCloset: ClothingItem[];
  yourOutfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  stylePreferences?: string[];
}): MemberLookProposal[] {
  const {
    event,
    yourCloset,
    yourOutfits,
    wearHistory,
    stylePreferences = [],
  } = options;

  return event.members.map((member) => {
    const closet = resolveMemberCloset(member, yourCloset);
    const prefs = [
      ...stylePreferences,
      ...member.palettePrefs,
      ...event.palette,
      event.vibe,
    ];

    const suggestions = suggestOutfitsForToday({
      occasion: event.occasion,
      items: closet,
      outfits: member.role === 'you' ? yourOutfits : [],
      wearHistory: member.role === 'you' ? wearHistory : [],
      stylePreferences: prefs,
      limit: 3,
    });

    // Prefer the suggestion that best matches the group palette.
    let best = suggestions[0];
    let bestScore = -1;
    for (const suggestion of suggestions) {
      const pieces = suggestion.itemIds
        .map((id) => closet.find((item) => item.id === id))
        .filter(Boolean) as ClothingItem[];
      const score =
        scorePaletteFit(pieces, event.palette) * 2 +
        scorePaletteFit(pieces, member.palettePrefs);
      if (score > bestScore) {
        bestScore = score;
        best = suggestion;
      }
    }

    const pieces = (best?.itemIds ?? [])
      .map((id) => closet.find((item) => item.id === id))
      .filter(Boolean) as ClothingItem[];

    const paletteHit = scorePaletteFit(pieces, event.palette);
    const paletteNote =
      paletteHit >= 0.5
        ? `Aligns with group palette (${event.palette.slice(0, 3).join(', ')})`
        : `Soft fit — leans on ${member.palettePrefs[0] ?? 'neutrals'} while staying in the group vibe`;

    const formalityNote = `Dress code: ${event.dressCode}`;

    return {
      member,
      title: best?.title ?? `${event.occasion} look`,
      reason:
        best?.reason ??
        (closet.length
          ? 'Best available pieces for this outing'
          : 'Not enough shared pieces yet'),
      itemIds: best?.itemIds ?? [],
      paletteNote,
      formalityNote,
    };
  });
}
