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

/** Recent days through today, newest first — for logging forgotten looks. */
export function recentDayOptions(
  count = 14,
  now: Date = new Date(),
): WornDay[] {
  const todayKey = toDayKey(now);
  const days: WornDay[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = toDayKey(date);
    if (key > todayKey) continue;
    days.push({
      key,
      label: formatDayHeading(key),
      shortLabel: date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      isToday: key === todayKey,
      entries: [],
    });
  }
  return days;
}

/**
 * Timestamp for a wear logged on a calendar day.
 * Today uses "now"; past days use local noon so they sort cleanly.
 */
export function wornAtForDayKey(key: DayKey, now: Date = new Date()): string {
  if (key === toDayKey(now)) return now.toISOString();
  return parseDayKey(key).toISOString();
}

export function isNewerOrSameTimestamp(
  candidate: string,
  existing?: string,
): boolean {
  if (!existing) return true;
  return new Date(candidate).getTime() >= new Date(existing).getTime();
}

export type WeekDay = WornDay & {
  /** After today in the current week strip */
  isFuture: boolean;
  weekdayShort: string;
};

/** Local Monday 12:00 for the week containing `now`. */
export function startOfWeekMonday(now: Date = new Date()): Date {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

/**
 * Seven days for the current week (Mon→Sun), including empty days.
 * Future days are marked so the UI can mute them.
 */
export function buildThisWeek(
  history: WearHistoryEntry[],
  now: Date = new Date(),
): {
  days: WeekDay[];
  wornDayCount: number;
  wearCount: number;
  label: string;
  rangeLabel: string;
} {
  const todayKey = toDayKey(now);
  const byDay = groupWearsByDay(history);
  const monday = startOfWeekMonday(now);
  const days: WeekDay[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + offset);
    const key = toDayKey(date);
    const entries = byDay.get(key) ?? [];
    days.push({
      key,
      label: formatDayHeading(key),
      shortLabel: date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      weekdayShort: date.toLocaleDateString(undefined, { weekday: 'short' }),
      isToday: key === todayKey,
      isFuture: key > todayKey,
      entries,
    });
  }

  const pastOrToday = days.filter((day) => !day.isFuture);
  const wornDayCount = pastOrToday.filter((day) => day.entries.length > 0).length;
  const wearCount = pastOrToday.reduce(
    (sum, day) => sum + day.entries.length,
    0,
  );

  const startLabel = monday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const endLabel = sunday.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return {
    days,
    wornDayCount,
    wearCount,
    label: 'This week',
    rangeLabel: `${startLabel} – ${endLabel}`,
  };
}

/** Month sections excluding days that belong to the current week strip. */
export function buildEarlierMonthSections(
  history: WearHistoryEntry[],
  now: Date = new Date(),
): WornMonthSection[] {
  const weekStartKey = toDayKey(startOfWeekMonday(now));
  const days = buildWornDayLog(history, now).filter(
    (day) => day.key < weekStartKey,
  );
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
