import type { ClothingItem, WearHistoryEntry } from '@/data/types';

export type DayKey = string; // YYYY-MM-DD (local)

export type WornDay = {
  key: DayKey;
  label: string;
  shortLabel: string;
  isToday: boolean;
  entries: WearHistoryEntry[];
};

export type WornMonthSection = {
  id: string; // YYYY-MM
  label: string;
  days: WornDay[];
};

export function toDayKey(input: Date | string): DayKey {
  const date = typeof input === 'string' ? new Date(input) : input;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key: DayKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function formatDayHeading(key: DayKey): string {
  const date = parseDayKey(key);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function groupWearsByDay(
  history: WearHistoryEntry[],
): Map<DayKey, WearHistoryEntry[]> {
  const map = new Map<DayKey, WearHistoryEntry[]>();
  for (const entry of history) {
    const key = toDayKey(entry.wornAt);
    const list = map.get(key) || [];
    list.push(entry);
    map.set(key, list);
  }
  for (const [key, list] of map) {
    list.sort(
      (a, b) => new Date(b.wornAt).getTime() - new Date(a.wornAt).getTime(),
    );
    map.set(key, list);
  }
  return map;
}

/**
 * Compact log: only days that have wears, newest first, never past today.
 */
export function buildWornDayLog(
  history: WearHistoryEntry[],
  now: Date = new Date(),
): WornDay[] {
  const todayKey = toDayKey(now);
  const byDay = groupWearsByDay(history);

  return [...byDay.entries()]
    .filter(([key]) => key <= todayKey)
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, entries]) => {
      const date = parseDayKey(key);
      return {
        key,
        label: formatDayHeading(key),
        shortLabel: date.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        isToday: key === todayKey,
        entries,
      };
    });
}

/** Group worn days under month headers for easier scanning. */
export function buildWornMonthSections(
  history: WearHistoryEntry[],
  now: Date = new Date(),
): WornMonthSection[] {
  const days = buildWornDayLog(history, now);
  const sections: WornMonthSection[] = [];

  for (const day of days) {
    const date = parseDayKey(day.key);
    const id = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    let section = sections.find((s) => s.id === id);
    if (!section) {
      section = {
        id,
        label: date.toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        }),
        days: [],
      };
      sections.push(section);
    }
    section.days.push(day);
  }

  return sections;
}

export function previewItemsForDay(
  entries: WearHistoryEntry[],
  itemsById: Map<string, ClothingItem>,
  limit = 3,
): ClothingItem[] {
  const seen = new Set<string>();
  const preview: ClothingItem[] = [];
  for (const entry of entries) {
    for (const id of entry.itemIds) {
      if (seen.has(id)) continue;
      const item = itemsById.get(id);
      if (!item) continue;
      seen.add(id);
      preview.push(item);
      if (preview.length >= limit) return preview;
    }
  }
  return preview;
}
