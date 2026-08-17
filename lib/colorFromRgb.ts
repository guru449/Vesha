export type Rgb = { r: number; g: number; b: number };

export function rgbToHsl(r: number, g: number, b: number): {
  h: number;
  s: number;
  l: number;
} {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s, l };
}

/** Map sampled RGB to a wardrobe-friendly color label. */
export function colorNameFromRgb(rgb: Rgb): string {
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);

  if (l < 0.18) return 'Black';
  // Near-white fabrics often carry a warm tint that spikes HSL saturation.
  if (l > 0.9) {
    if (s < 0.15) return 'White';
    if (h >= 30 && h < 70) return 'Cream';
    return 'Ivory';
  }
  if (l > 0.82 && s < 0.35) return 'Ivory';
  if (s < 0.14) {
    if (l < 0.28) return 'Black';
    if (l < 0.4) return 'Charcoal';
    if (l < 0.55) return 'Gray';
    if (l < 0.75) return 'Light gray';
    return 'Ivory';
  }

  if (h < 20 || h >= 340) {
    // Dark, muted reds read as brown more often than burgundy on clothing.
    if (l < 0.38 && s < 0.6) return 'Chocolate brown';
    if (l < 0.35) return 'Burgundy';
    return l > 0.65 ? 'Coral' : 'Red';
  }
  if (h < 50) {
    if (l < 0.28) return 'Chocolate brown';
    if (l < 0.45) return 'Cognac';
    if (s > 0.5 && h > 30) return 'Orange';
    if (l > 0.7 && s < 0.35) return 'Cream';
    return 'Camel';
  }
  if (h < 70) {
    if (l > 0.7) return 'Cream';
    return l < 0.4 ? 'Olive' : 'Mustard';
  }
  if (h < 160) {
    if (l < 0.35) return 'Forest green';
    if (h < 100) return 'Olive';
    return l > 0.55 ? 'Sage green' : 'Emerald green';
  }
  if (h < 200) return l > 0.55 ? 'Teal' : 'Deep teal';
  if (h < 255) {
    if (l < 0.3) return 'Navy';
    if (l > 0.65) return 'Light blue';
    return 'Blue';
  }
  if (h < 290) return l > 0.55 ? 'Lavender' : 'Purple';
  if (h < 330) return l > 0.55 ? 'Dusty rose' : 'Magenta';
  return 'Red';
}
