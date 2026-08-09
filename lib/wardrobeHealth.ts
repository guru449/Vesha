import type { ClothingCategory } from '@/constants/theme';
import type { ClothingItem, Outfit, WearHistoryEntry } from '@/data/types';

export type HealthSeverity = 'good' | 'info' | 'warning';

export type HealthFindingKind =
  | 'utilization'
  | 'versatility'
  | 'dormant'
  | 'gap'
  | 'strength'
  | 'balance';

export type HealthFinding = {
  id: string;
  kind: HealthFindingKind;
  severity: HealthSeverity;
  title: string;
  detail: string;
  /** Optional metric shown as a chip (e.g. 72%) */
  metricLabel?: string;
  itemIds?: string[];
};

export type WardrobeHealthReport = {
  score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs care';
  summary: string;
  findings: HealthFinding[];
  analyzedAt: string;
};

const DORMANT_DAYS = 90;
const REGULAR_WEAR_MIN = 2;

const NEUTRAL_COLOR_TOKENS = [
  'black',
  'white',
  'cream',
  'ivory',
  'navy',
  'grey',
  'gray',
  'charcoal',
  'beige',
  'tan',
  'khaki',
  'natural',
  'cognac',
  'brown',
  'taupe',
  'stone',
  'camel',
  'olive',
  'sage',
];

type WearInfo = { count: number; lastWornAt?: string };

function daysBetween(fromIso: string, toMs: number): number {
  return (toMs - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24);
}

function buildWearMap(history: WearHistoryEntry[]): Map<string, WearInfo> {
  const map = new Map<string, WearInfo>();
  for (const entry of history) {
    for (const itemId of entry.itemIds) {
      const prev = map.get(itemId) || { count: 0 };
      const newer =
        !prev.lastWornAt ||
        new Date(entry.wornAt).getTime() > new Date(prev.lastWornAt).getTime();
      map.set(itemId, {
        count: prev.count + 1,
        lastWornAt: newer ? entry.wornAt : prev.lastWornAt,
      });
    }
  }
  return map;
}

function normalizeColor(color: string): string {
  return color.trim().toLowerCase();
}

function isNeutralColor(color: string): boolean {
  const c = normalizeColor(color);
  return NEUTRAL_COLOR_TOKENS.some((token) => c.includes(token));
}

function colorFamily(color: string): string {
  const c = normalizeColor(color);
  if (c.includes('black') || c.includes('charcoal')) return 'black';
  if (c.includes('white') || c.includes('ivory') || c.includes('cream')) {
    return 'light';
  }
  if (c.includes('navy') || c.includes('indigo') || c.includes('blue')) {
    return 'blue';
  }
  if (
    c.includes('brown') ||
    c.includes('cognac') ||
    c.includes('tan') ||
    c.includes('camel') ||
    c.includes('taupe')
  ) {
    return 'brown';
  }
  if (c.includes('green') || c.includes('sage') || c.includes('olive')) {
    return 'green';
  }
  if (c.includes('rose') || c.includes('pink') || c.includes('blush')) {
    return 'pink';
  }
  if (c.includes('gold') || c.includes('yellow')) return 'metal';
  if (c.includes('grey') || c.includes('gray') || c.includes('stone')) {
    return 'grey';
  }
  return c.split(/\s+/)[0] || c;
}

/** Simple pairing model: neutrals go with everything; same family works; a few classic clashes. */
export function colorsWorkTogether(a: string, b: string): boolean {
  if (isNeutralColor(a) || isNeutralColor(b)) return true;
  const fa = colorFamily(a);
  const fb = colorFamily(b);
  if (fa === fb) return true;
  const pair = [fa, fb].sort().join('|');
  const friendly = new Set([
    'blue|green',
    'brown|green',
    'brown|pink',
    'green|pink',
    'blue|pink',
    'grey|pink',
    'grey|green',
    'blue|grey',
  ]);
  return friendly.has(pair);
}

function occasionCompatible(a: string, b: string): boolean {
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na === nb) return true;
  const casual = ['casual', 'everyday', 'brunch', 'travel'];
  const smart = ['work', 'smart casual', 'smart', 'evening'];
  const aCasual = casual.some((x) => na.includes(x));
  const bCasual = casual.some((x) => nb.includes(x));
  const aSmart = smart.some((x) => na.includes(x));
  const bSmart = smart.some((x) => nb.includes(x));
  if (aCasual && bCasual) return true;
  if (aSmart && bSmart) return true;
  if ((na.includes('everyday') || nb.includes('everyday')) && (aCasual || bCasual || aSmart || bSmart)) {
    return true;
  }
  return false;
}

function itemsWorkTogether(a: ClothingItem, b: ClothingItem): boolean {
  return (
    colorsWorkTogether(a.attributes.color, b.attributes.color) &&
    occasionCompatible(a.attributes.occasion, b.attributes.occasion)
  );
}

function categoryLabel(category: ClothingCategory | string, count: number): string {
  const lower = category.toLowerCase();
  if (lower === 'tops') return count === 1 ? 'top' : 'tops';
  if (lower === 'bottoms') return count === 1 ? 'bottom' : 'bottoms';
  if (lower === 'dresses') return count === 1 ? 'dress' : 'dresses';
  if (lower === 'shoes') return count === 1 ? 'pair of shoes' : 'pairs of shoes';
  return lower;
}

function scoreGrade(score: number): WardrobeHealthReport['grade'] {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs care';
}

function buildUtilizationFindings(
  items: ClothingItem[],
  wearMap: Map<string, WearInfo>,
): HealthFinding[] {
  const findings: HealthFinding[] = [];
  const byCategory = new Map<string, ClothingItem[]>();
  for (const item of items) {
    const key = item.attributes.category;
    const list = byCategory.get(key) || [];
    list.push(item);
    byCategory.set(key, list);
  }

  for (const [category, list] of byCategory) {
    if (list.length < 2) continue;
    const regularlyWorn = list.filter((item) => {
      const wear = wearMap.get(item.id);
      return (wear?.count ?? 0) >= REGULAR_WEAR_MIN;
    });
    const wornAtLeastOnce = list.filter(
      (item) => (wearMap.get(item.id)?.count ?? 0) > 0,
    );
    const activeCount =
      regularlyWorn.length > 0 ? regularlyWorn.length : wornAtLeastOnce.length;
    const threshold = regularlyWorn.length > 0 ? REGULAR_WEAR_MIN : 1;

    if (list.length >= 2 && activeCount < list.length) {
      const unused = list.filter((item) => {
        const count = wearMap.get(item.id)?.count ?? 0;
        return count < threshold;
      });
      findings.push({
        id: `util-${category}`,
        kind: 'utilization',
        severity: activeCount / list.length < 0.5 ? 'warning' : 'info',
        title: `You own ${list.length} ${categoryLabel(category, list.length)} but only ${activeCount} ${
          activeCount === 1 ? 'is' : 'are'
        } regularly worn.`,
        detail:
          threshold >= REGULAR_WEAR_MIN
            ? `${unused.length} piece${unused.length === 1 ? '' : 's'} in ${category} ${
                unused.length === 1 ? 'gets' : 'get'
              } little rotation. Try building an outfit around them on Today.`
            : `Some ${category.toLowerCase()} have never made it into a logged outfit. Give them a turn this week.`,
        metricLabel: `${activeCount}/${list.length} active`,
        itemIds: unused.map((item) => item.id),
      });
    } else if (list.length >= 3 && activeCount === list.length) {
      findings.push({
        id: `util-good-${category}`,
        kind: 'strength',
        severity: 'good',
        title: `Your ${category.toLowerCase()} get solid rotation.`,
        detail: `All ${list.length} ${categoryLabel(category, list.length)} show up in wear history — nice balance.`,
        metricLabel: '100% active',
      });
    }
  }

  return findings;
}

function buildVersatilityFindings(
  items: ClothingItem[],
): HealthFinding[] {
  const findings: HealthFinding[] = [];
  const tops = items.filter((item) => item.attributes.category === 'Tops');
  const bottoms = items.filter((item) => item.attributes.category === 'Bottoms');
  const shoes = items.filter((item) => item.attributes.category === 'Shoes');

  if (tops.length === 0) return findings;

  const scorePiece = (piece: ClothingItem) => {
    const matches = tops.filter((top) => itemsWorkTogether(piece, top));
    const percent = Math.round((matches.length / tops.length) * 100);
    return { piece, matches, percent };
  };

  const candidates = [...bottoms, ...shoes].map(scorePiece);
  if (!candidates.length) return findings;

  const best = [...candidates].sort((a, b) => b.percent - a.percent)[0];
  if (best) {
    const role =
      best.piece.attributes.category === 'Shoes' ? 'shoes' : 'pants';
    findings.push({
      id: `versatile-${best.piece.id}`,
      kind: 'versatility',
      severity: best.percent >= 70 ? 'good' : best.percent >= 40 ? 'info' : 'warning',
      title: `Your ${best.piece.name} work with ${best.percent}% of your tops.`,
      detail:
        best.percent >= 70
          ? `A true workhorse ${role === 'shoes' ? 'pair' : 'piece'} — lean on ${best.piece.attributes.color.toLowerCase()} when you want easy outfits.`
          : `Only ${best.matches.length} of ${tops.length} tops pair cleanly. Neutral tops would stretch this further.`,
      metricLabel: `${best.percent}% match`,
      itemIds: [best.piece.id, ...best.matches.map((item) => item.id)],
    });
  }

  const weakest = [...candidates]
    .filter((entry) => entry.percent < 50)
    .sort((a, b) => a.percent - b.percent)[0];
  if (weakest && weakest.piece.id !== best?.piece.id) {
    findings.push({
      id: `versatile-low-${weakest.piece.id}`,
      kind: 'versatility',
      severity: 'warning',
      title: `${weakest.piece.name} only pairs with ${weakest.percent}% of tops.`,
      detail: `Color and occasion clash with most of your tops. Style it with neutrals, or consider editing the wardrobe.`,
      metricLabel: `${weakest.percent}% match`,
      itemIds: [weakest.piece.id],
    });
  }

  return findings;
}

function buildDormantFindings(
  items: ClothingItem[],
  wearMap: Map<string, WearInfo>,
  nowMs: number,
): HealthFinding[] {
  const dormant = items.filter((item) => {
    const wear = wearMap.get(item.id);
    if (!wear?.lastWornAt) return true;
    return daysBetween(wear.lastWornAt, nowMs) >= DORMANT_DAYS;
  });

  if (!dormant.length) {
    return [
      {
        id: 'dormant-none',
        kind: 'strength',
        severity: 'good',
        title: 'No forgotten pieces right now.',
        detail: `Everything has been worn within the last ${DORMANT_DAYS} days — keep that momentum.`,
      },
    ];
  }

  const neverWorn = dormant.filter((item) => !wearMap.get(item.id)?.lastWornAt);
  const allNever = neverWorn.length === dormant.length;

  return [
    {
      id: 'dormant-list',
      kind: 'dormant',
      severity: dormant.length >= 4 ? 'warning' : 'info',
      title: allNever
        ? `You haven't worn these ${dormant.length} item${dormant.length === 1 ? '' : 's'} yet.`
        : `You haven't worn these ${dormant.length} item${dormant.length === 1 ? '' : 's'} in ${DORMANT_DAYS} days.`,
      detail: allNever
        ? 'They are sitting idle while other pieces rotate. Pull one into Tomorrow’s look from the Today tab.'
        : 'Long gaps usually mean the piece is hard to style — or just forgotten. Reintroduce one this week.',
      metricLabel: `${dormant.length} idle`,
      itemIds: dormant.map((item) => item.id),
    },
  ];
}

function colorPresent(items: ClothingItem[], tokens: string[]): boolean {
  return items.some((item) => {
    const c = normalizeColor(item.attributes.color);
    return tokens.some((token) => c.includes(token));
  });
}

function buildGapFindings(items: ClothingItem[]): HealthFinding[] {
  const findings: HealthFinding[] = [];
  const shoes = items.filter((item) => item.attributes.category === 'Shoes');
  const bottoms = items.filter((item) => item.attributes.category === 'Bottoms');
  const tops = items.filter((item) => item.attributes.category === 'Tops');

  if (shoes.length === 0) {
    findings.push({
      id: 'gap-shoes',
      kind: 'gap',
      severity: 'warning',
      title: "You're missing shoes entirely.",
      detail: 'Add at least one versatile pair — black or brown — to finish most outfits.',
    });
  } else {
    const hasBlackShoes = colorPresent(shoes, ['black', 'charcoal']);
    const hasBrownShoes = colorPresent(shoes, [
      'brown',
      'cognac',
      'tan',
      'camel',
      'taupe',
    ]);
    if (!hasBrownShoes) {
      findings.push({
        id: 'gap-brown-shoes',
        kind: 'gap',
        severity: 'warning',
        title: "You're missing versatile brown shoes.",
        detail:
          'Brown or cognac shoes unlock earthy tops and cream bottoms. One pair covers casual and smart-casual looks.',
      });
    }
    if (!hasBlackShoes) {
      findings.push({
        id: 'gap-black-shoes',
        kind: 'gap',
        severity: 'info',
        title: "You're missing versatile black shoes.",
        detail:
          'Black shoes pair with almost every top and bottom for work and evening. A simple pair closes a common gap.',
      });
    }
  }

  if (bottoms.length === 0) {
    findings.push({
      id: 'gap-bottoms',
      kind: 'gap',
      severity: 'warning',
      title: "You're missing bottoms.",
      detail: 'Add dark jeans or tailored trousers — they carry most of a weekly rotation.',
    });
  } else if (!colorPresent(bottoms, ['black', 'navy', 'indigo', 'charcoal', 'grey', 'gray'])) {
    findings.push({
      id: 'gap-dark-bottoms',
      kind: 'gap',
      severity: 'info',
      title: "You're missing dark versatile bottoms.",
      detail:
        'Black or navy pants work with most tops. Right now your bottoms lean light — a dark pair would raise outfit count fast.',
    });
  }

  if (tops.length > 0 && !colorPresent(tops, ['white', 'ivory', 'cream'])) {
    findings.push({
      id: 'gap-light-tops',
      kind: 'gap',
      severity: 'info',
      title: "You're missing a light neutral top.",
      detail: 'A white or cream shirt is the fastest way to raise versatility across bottoms and shoes.',
    });
  }

  if (
    !items.some(
      (item) =>
        /jacket|coat|blazer|outer/i.test(item.name) ||
        /jacket|coat|blazer/i.test(item.attributes.style),
    )
  ) {
    findings.push({
      id: 'gap-outerwear',
      kind: 'gap',
      severity: 'info',
      title: "You're missing a layering piece.",
      detail: 'A blazer or light jacket stretches casual pieces into work and evening looks.',
    });
  }

  if (!findings.length) {
    findings.push({
      id: 'gap-none',
      kind: 'strength',
      severity: 'good',
      title: 'Core wardrobe gaps look covered.',
      detail: 'Neutrals, shoes, and bottoms are present — focus on wearing what you already own.',
    });
  }

  return findings;
}

function buildBalanceFinding(
  items: ClothingItem[],
  wearMap: Map<string, WearInfo>,
): HealthFinding | null {
  if (items.length < 4) return null;
  const worn = items.filter((item) => (wearMap.get(item.id)?.count ?? 0) > 0);
  const rate = Math.round((worn.length / items.length) * 100);
  if (rate >= 75) {
    return {
      id: 'balance-good',
      kind: 'balance',
      severity: 'good',
      title: `${rate}% of your wardrobe has been worn.`,
      detail: 'Strong utilization overall — keep logging outfits so insights stay sharp.',
      metricLabel: `${rate}% worn`,
    };
  }
  return {
    id: 'balance-low',
    kind: 'balance',
    severity: rate < 40 ? 'warning' : 'info',
    title: `Only ${rate}% of your wardrobe has been worn.`,
    detail: `${items.length - worn.length} pieces never appear in wear history. Small weekly goals beat closet guilt.`,
    metricLabel: `${rate}% worn`,
  };
}

function computeScore(
  items: ClothingItem[],
  wearMap: Map<string, WearInfo>,
  findings: HealthFinding[],
): number {
  if (!items.length) return 0;

  const wornRate =
    items.filter((item) => (wearMap.get(item.id)?.count ?? 0) > 0).length /
    items.length;
  const dormantPenalty =
    findings.filter((f) => f.kind === 'dormant' && f.severity === 'warning').length * 8;
  const gapPenalty =
    findings.filter((f) => f.kind === 'gap' && f.severity !== 'good').length * 7;
  const utilPenalty =
    findings.filter((f) => f.kind === 'utilization' && f.severity === 'warning')
      .length * 6;
  const strengthBonus =
    findings.filter((f) => f.severity === 'good').length * 4;

  const versatility = findings.find((f) => f.kind === 'versatility' && f.metricLabel);
  let versatilityBoost = 0;
  if (versatility?.metricLabel) {
    const pct = Number.parseInt(versatility.metricLabel, 10);
    if (!Number.isNaN(pct)) versatilityBoost = Math.round(pct * 0.15);
  }

  const raw =
    40 +
    Math.round(wornRate * 40) +
    versatilityBoost +
    strengthBonus -
    dormantPenalty -
    gapPenalty -
    utilPenalty;

  return Math.max(12, Math.min(98, raw));
}

/**
 * Rule-based wardrobe health analysis (Phase 4 "AI" insights).
 * Produces human-readable findings: utilization, versatility, dormant items, gaps.
 */
export function analyzeWardrobeHealth(
  items: ClothingItem[],
  wearHistory: WearHistoryEntry[],
  _outfits: Outfit[] = [],
  nowMs: number = Date.now(),
): WardrobeHealthReport {
  if (!items.length) {
    return {
      score: 0,
      grade: 'Needs care',
      summary: 'Add a few pieces to unlock wardrobe health.',
      findings: [
        {
          id: 'empty',
          kind: 'gap',
          severity: 'warning',
          title: 'Your wardrobe is empty.',
          detail: 'Photograph a few everyday pieces to start your health check.',
        },
      ],
      analyzedAt: new Date(nowMs).toISOString(),
    };
  }

  const wearMap = buildWearMap(wearHistory);
  const findings: HealthFinding[] = [
    ...buildUtilizationFindings(items, wearMap),
    ...buildVersatilityFindings(items),
    ...buildDormantFindings(items, wearMap, nowMs),
    ...buildGapFindings(items),
  ];

  const balance = buildBalanceFinding(items, wearMap);
  if (balance) findings.push(balance);

  // Stable, useful order: warnings first, then info, then strengths
  const severityRank = { warning: 0, info: 1, good: 2 };
  findings.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );

  const score = computeScore(items, wearMap, findings);
  const grade = scoreGrade(score);
  const warningCount = findings.filter((f) => f.severity === 'warning').length;

  const summary =
    grade === 'Excellent' || grade === 'Good'
      ? 'Your closet is in solid shape — a few focused tweaks would make dressing even easier.'
      : warningCount > 0
        ? `${warningCount} area${warningCount === 1 ? '' : 's'} need attention: idle pieces, gaps, or uneven wear.`
        : 'There’s room to improve utilization and fill a few versatile gaps.';

  return {
    score,
    grade,
    summary,
    findings,
    analyzedAt: new Date(nowMs).toISOString(),
  };
}
