import type { ClothingItem, WearHistoryEntry } from '@/data/types';

export type DayKey = string; // YYYY-MM-DD (local)

export type CalendarDay = {
  key: DayKey;
  year: number;
  month: number; // 0-11
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  entries: WearHistoryEntry[];
};

export type MonthModel = {
  id: string; // YYYY-MM
  year: number;
  month: number;
  label: string;
  days: CalendarDay[];
  daysWorn: number;
  totalWears: number;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function weekdayLabels(): readonly string[] {
  return WEEKDAYS;
}

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

function buildMonthGrid(
  year: number,
  month: number,
  byDay: Map<DayKey, WearHistoryEntry[]>,
  todayKey: DayKey,
): CalendarDay[] {
  const first = new Date(year, month, 1, 12);
  const startPad = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: CalendarDay[] = [];

  // Leading days from previous month
  for (let i = startPad - 1; i >= 0; i -= 1) {
    const date = new Date(year, month, -i, 12);
    const key = toDayKey(date);
    cells.push({
      key,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      inMonth: false,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      entries: byDay.get(key) || [],
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day, 12);
    const key = toDayKey(date);
    cells.push({
      key,
      year,
      month,
      day,
      inMonth: true,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      entries: byDay.get(key) || [],
    });
  }

  // Trailing to complete weeks (42 cells = 6 weeks max)
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!;
    const date = new Date(last.year, last.month, last.day + 1, 12);
    const key = toDayKey(date);
    cells.push({
      key,
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      inMonth: false,
      isToday: key === todayKey,
      isFuture: key > todayKey,
      entries: byDay.get(key) || [],
    });
  }

  return cells;
}

export function buildMonthModels(
  history: WearHistoryEntry[],
  options?: { monthsBack?: number; monthsForward?: number; now?: Date },
): MonthModel[] {
  const now = options?.now ?? new Date();
  const monthsBack = options?.monthsBack ?? 8;
  const monthsForward = options?.monthsForward ?? 1;
  const byDay = groupWearsByDay(history);
  const todayKey = toDayKey(now);
  const models: MonthModel[] = [];

  for (let offset = -monthsBack; offset <= monthsForward; offset += 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() + offset, 1, 12);
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const days = buildMonthGrid(year, month, byDay, todayKey);
    const inMonthDays = days.filter((d) => d.inMonth);
    const daysWorn = inMonthDays.filter((d) => d.entries.length > 0).length;
    const totalWears = inMonthDays.reduce(
      (sum, d) => sum + d.entries.length,
      0,
    );

    models.push({
      id: `${year}-${String(month + 1).padStart(2, '0')}`,
      year,
      month,
      label: cursor.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
      days,
      daysWorn,
      totalWears,
    });
  }

  return models;
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

export function monthStreakLabel(model: MonthModel): string {
  if (model.daysWorn === 0) return 'No looks logged this month';
  if (model.daysWorn === 1) return '1 day with a logged look';
  return `${model.daysWorn} days with logged looks`;
}
