import {
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

import type { ClothingAttributes } from '@/data/types';
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
      // Skip blown highlights / deep voids typical of backgrounds.
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

function attributesForColor(color: string): {
  suggestedName: string;
  attributes: ClothingAttributes;
  confidence: number;
} {
  // Gender-neutral top naming — never default to "blouse".
  const suggestedName = `${color} Button Shirt`;
  return {
    suggestedName,
    confidence: 0.72,
    attributes: {
      category: 'Tops',
      color,
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Button-up',
      occasion: 'Smart casual',
    },
  };
}

/**
 * Local demo identifier: samples garment color from the photo.
 * Not full vision — used when live AI is unavailable so demos
 * don't always return the same "Soft Cotton Blouse / Ivory".
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
      return fallbackIdentify(imageUri);
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
    const built = attributesForColor(color);

    return {
      matched: true,
      imageUri,
      suggestedName: built.suggestedName,
      confidence: built.confidence,
      attributes: built.attributes,
    };
  } catch (error) {
    console.warn('Heuristic identify failed', error);
    return fallbackIdentify(imageUri);
  }
}

function fallbackIdentify(imageUri: string): AiIdentifyResult {
  return {
    matched: true,
    imageUri,
    suggestedName: 'Casual Button Shirt',
    confidence: 0.55,
    attributes: {
      category: 'Tops',
      color: 'Unknown',
      pattern: 'Solid',
      material: 'Cotton',
      style: 'Button-up',
      occasion: 'Casual',
    },
  };
}

export { colorNameFromRgb };
