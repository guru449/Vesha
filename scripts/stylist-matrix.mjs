import { suggestOutfitsForToday, diagnoseWardrobeGaps } from '../lib/stylist.ts';
import { mockWardrobe, demoUser } from '../data/mockWardrobe.ts';
import { mockOutfits } from '../data/mockOutfits.ts';
import { mockWearHistory } from '../data/mockWearHistory.ts';

const occasions = ['Casual', 'Work', 'Brunch', 'Evening', 'Travel'];
const weathers = [
  { tempC: 32, feelsLikeC: 34, precipMm: 0, weatherCode: 0, label: 'Clear', band: 'hot', isRainy: false, city: 'Test', source: 'live' },
  { tempC: 24, feelsLikeC: 24, precipMm: 0, weatherCode: 1, label: 'Partly cloudy', band: 'warm', isRainy: false, city: 'Test', source: 'live' },
  { tempC: 18, feelsLikeC: 17, precipMm: 0, weatherCode: 2, label: 'Mild', band: 'mild', isRainy: false, city: 'Test', source: 'live' },
  { tempC: 12, feelsLikeC: 10, precipMm: 0, weatherCode: 3, label: 'Cool', band: 'cool', isRainy: false, city: 'Test', source: 'live' },
  { tempC: 4, feelsLikeC: 1, precipMm: 0, weatherCode: 71, label: 'Snow', band: 'cold', isRainy: false, city: 'Test', source: 'live' },
  { tempC: 16, feelsLikeC: 15, precipMm: 6, weatherCode: 61, label: 'Rain', band: 'mild', isRainy: true, city: 'Test', source: 'live' },
];
const prefSets = [
  [],
  ['Minimal', 'Smart casual', 'Earthy tones'],
  ['Street', 'Sport'],
  ['Elegant'],
];

function summarize(sugs, items = mockWardrobe) {
  return sugs
    .map((s, i) => {
      const names = s.itemIds
        .map((id) => items.find((x) => x.id === id)?.name ?? id)
        .join(' + ');
      return `  ${i + 1}. [${s.sourceOutfitId ? 'saved' : 'new'}] ${s.title} | ${s.reason}\n     ${names}`;
    })
    .join('\n');
}

let empty = 0;
let thin = 0;
let total = 0;
const issues = [];
const samples = [];

for (const occasion of occasions) {
  for (const weather of weathers) {
    for (const prefs of prefSets) {
      total += 1;
      const sugs = suggestOutfitsForToday({
        occasion,
        items: mockWardrobe,
        outfits: mockOutfits,
        wearHistory: mockWearHistory,
        stylePreferences: prefs,
        weather,
        limit: 3,
      });
      if (sugs.length === 0) {
        empty += 1;
        const gap = diagnoseWardrobeGaps({ occasion, items: mockWardrobe });
        issues.push(
          `EMPTY ${occasion} / ${weather.band}${weather.isRainy ? '+rain' : ''} / prefs=${prefs.join(',') || 'none'} → ${gap.message}`,
        );
      } else if (sugs.length < 2) {
        thin += 1;
        issues.push(
          `THIN(${sugs.length}) ${occasion} / ${weather.band}${weather.isRainy ? '+rain' : ''}`,
        );
      }

      // Flag odd combos: jacket as only top in hot weather new combo
      for (const s of sugs) {
        if (s.sourceOutfitId) continue;
        const pieces = s.itemIds.map((id) => mockWardrobe.find((x) => x.id === id));
        const names = pieces.map((p) => p?.name).join(', ');
        if (
          (weather.band === 'hot' || weather.band === 'warm') &&
          names.includes('Navy Crew Sweater')
        ) {
          issues.push(
            `HOT+SWEATER ${occasion} / ${weather.band}: ${s.title} → ${names}`,
          );
        }
        if (weather.band === 'cold' && names.includes('Chambray Button Shirt') && !names.includes('Sweater') && !names.includes('Jacket')) {
          issues.push(
            `COLD+LINEN ${occasion}: ${s.title} → ${names}`,
          );
        }
      }
    }
  }
}

console.log('=== COVERAGE ===');
console.log({ total, empty, thin, ok: total - empty - thin });

const demos = [
  ['Casual', weathers[1], demoUser.stylePreferences],
  ['Work', weathers[4], demoUser.stylePreferences],
  ['Evening', weathers[0], ['Elegant']],
  ['Brunch', weathers[5], demoUser.stylePreferences],
  ['Travel', weathers[3], []],
  ['Casual', weathers[0], demoUser.stylePreferences],
];

for (const [occasion, weather, prefs] of demos) {
  console.log(
    `\n=== ${occasion} / ${weather.band}${weather.isRainy ? '+rain' : ''} / prefs=${prefs.join(',') || 'none'} ===`,
  );
  console.log(
    summarize(
      suggestOutfitsForToday({
        occasion,
        items: mockWardrobe,
        outfits: mockOutfits,
        wearHistory: mockWearHistory,
        stylePreferences: prefs,
        weather,
        limit: 3,
      }),
    ),
  );
}

const cats = mockWardrobe.reduce((a, i) => {
  a[i.attributes.category] = (a[i.attributes.category] || 0) + 1;
  return a;
}, {});
console.log('\n=== CATEGORY COUNTS ===');
console.log(cats);

console.log('\n=== ISSUES ===');
const uniqueIssues = [...new Set(issues)];
uniqueIssues.forEach((i) => console.log(i));
console.log('issue count', uniqueIssues.length);
