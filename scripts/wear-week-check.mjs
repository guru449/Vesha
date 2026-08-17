/**
 * Quick checks for This week strip helpers.
 * Run: node scripts/wear-week-check.mjs
 */
import assert from 'node:assert/strict';

function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeekMonday(now) {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
}

// Wednesday Aug 12 2026
const now = new Date(2026, 7, 12, 15, 0, 0);
const monday = startOfWeekMonday(now);
assert.equal(toDayKey(monday), '2026-08-10'); // Mon
assert.equal(monday.getDay(), 1);

const days = [];
for (let i = 0; i < 7; i += 1) {
  const d = new Date(monday);
  d.setDate(monday.getDate() + i);
  days.push(toDayKey(d));
}
assert.deepEqual(days, [
  '2026-08-10',
  '2026-08-11',
  '2026-08-12',
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
]);

const todayKey = toDayKey(now);
const future = days.filter((k) => k > todayKey);
assert.deepEqual(future, [
  '2026-08-13',
  '2026-08-14',
  '2026-08-15',
  '2026-08-16',
]);

console.log('wear-week-check: ok');
