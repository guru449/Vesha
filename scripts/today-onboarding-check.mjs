/**
 * Quick readiness checks for Today first-run (no Expo runtime).
 * Run: node scripts/today-onboarding-check.mjs
 */
import assert from 'node:assert/strict';

// Mirror getTodayOnboarding rules via diagnose-equivalent checks
function gaps(items) {
  if (items.length === 0) {
    return { missing: ['tops or a dress', 'bottoms', 'shoes'] };
  }
  const counts = items.reduce((acc, item) => {
    acc[item.cat] = (acc[item.cat] || 0) + 1;
    return acc;
  }, {});
  const hasDress = (counts.Dresses || 0) > 0;
  const hasTop = (counts.Tops || 0) > 0;
  const hasBottom = (counts.Bottoms || 0) > 0;
  const hasShoes = (counts.Shoes || 0) > 0;
  const missing = [];
  if (!hasDress && !hasTop) missing.push('a top or dress');
  if (!hasDress && !hasBottom) missing.push('bottoms');
  if (!hasShoes) missing.push('shoes');
  return { missing };
}

function status(items) {
  const pieceCount = items.length;
  const { missing } = gaps(items);
  const canSuggest = missing.length === 0 && pieceCount > 0;
  if (pieceCount === 0) return 'empty';
  if (!canSuggest) return 'building';
  if (pieceCount < 6) return 'building';
  return 'ready';
}

assert.equal(status([]), 'empty');
assert.equal(status([{ cat: 'Tops' }]), 'building');
assert.equal(
  status([{ cat: 'Tops' }, { cat: 'Bottoms' }, { cat: 'Shoes' }]),
  'building',
);
assert.equal(
  status([
    { cat: 'Tops' },
    { cat: 'Tops' },
    { cat: 'Bottoms' },
    { cat: 'Bottoms' },
    { cat: 'Shoes' },
    { cat: 'Shoes' },
  ]),
  'ready',
);
assert.equal(
  status([{ cat: 'Dresses' }, { cat: 'Shoes' }]),
  'building', // can suggest but < 6 → building
);

console.log('today-onboarding-check: ok');
