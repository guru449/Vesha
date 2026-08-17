import {
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import type { AiIdentifyResult } from '@/data/mockWardrobe';
import { colorNameFromRgb, type Rgb } from '@/lib/colorFromRgb';

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.includes(',') ? base64.split(',')[1]! : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Average non-background-ish pixels from the center of the frame.
 * Skips near-white / near-black extremes that are often walls/shadows.
 */
function sampleDominantRgb(
  data: Uint8Array,
  width: number,
  height: number,
): Rgb {
  const x0 = Math.floor(width * 0.25);
  const x1 = Math.floor(width * 0.75);
  const y0 = Math.floor(height * 0.2);
  const y1 = Math.floor(height * 0.8);

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (luma > 245 || luma < 18) continue;
      rSum += r;
      gSum += g;
      bSum += b;
      count += 1;
    }
  }

  if (!count) {
    return { r: 128, g: 128, b: 128 };
  }
  return {
    r: Math.round(rSum / count),
    g: Math.round(gSum / count),
    b: Math.round(bSum / count),
  };
}

/**
 * Local fallback when live vision AI is unavailable.
 * Only samples color — does NOT invent garment type (no fake "Button Shirt").
 * Confirm UI must ask the user to pick category.
 */
export async function heuristicIdentifyFromImage(
  imageUri: string,
): Promise<AiIdentifyResult> {
  try {
    const resized = await manipulateAsync(
      imageUri,
      [{ resize: { width: 120 } }],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
        base64: true,
      },
    );

    if (!resized.base64) {
      return colorOnlyResult(imageUri, 'Unknown');
    }

    const raw = jpeg.decode(base64ToUint8Array(resized.base64), {
      useTArray: true,
    });
    const rgb = sampleDominantRgb(
      raw.data as Uint8Array,
      raw.width,
      raw.height,
    );
    const color = colorNameFromRgb(rgb);
    return colorOnlyResult(imageUri, color);
  } catch (error) {
    console.warn('Heuristic identify failed', error);
    return colorOnlyResult(imageUri, 'Unknown');
  }
}

function colorOnlyResult(imageUri: string, color: string): AiIdentifyResult {
  return {
    matched: true,
    imageUri,
    suggestedName: color === 'Unknown' ? 'New piece' : `${color} piece`,
    // Below HIGH_CONFIDENCE so the edit form opens; needsCategory blocks one-tap.
    confidence: 0.45,
    needsCategory: true,
    attributes: {
      // Placeholder only — UI requires an explicit category tap.
      category: 'Tops',
      color,
      pattern: 'Solid',
      material: 'Unknown',
      style: 'Unknown',
      occasion: 'Everyday',
    },
  };
}

export { colorNameFromRgb };
