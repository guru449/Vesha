import {
  manipulateAsync,
  SaveFormat,
} from 'expo-image-manipulator';
import jpeg from 'jpeg-js';

export type QualityIssueCode =
  | 'low_resolution'
  | 'too_dark'
  | 'too_bright'
  | 'low_contrast'
  | 'blurry';

export type QualityIssue = {
  code: QualityIssueCode;
  severity: 'warning' | 'blocker';
  message: string;
};

export type ImageQualityReport = {
  ok: boolean;
  score: number;
  issues: QualityIssue[];
  metrics: {
    width: number;
    height: number;
    meanLuma: number;
    contrast: number;
    sharpness: number;
  };
};

function base64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.includes(',') ? base64.split(',')[1]! : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function lumaAt(data: Uint8Array, width: number, x: number, y: number): number {
  const i = (y * width + x) * 4;
  const r = data[i] ?? 0;
  const g = data[i + 1] ?? 0;
  const b = data[i + 2] ?? 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function analyzePixels(
  data: Uint8Array,
  width: number,
  height: number,
): { meanLuma: number; contrast: number; sharpness: number } {
  let sum = 0;
  let sumSq = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  const total = width * height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const luma = lumaAt(data, width, x, y);
      sum += luma;
      sumSq += luma * luma;

      if (x < width - 1 && y < height - 1) {
        const dx = luma - lumaAt(data, width, x + 1, y);
        const dy = luma - lumaAt(data, width, x, y + 1);
        edgeSum += dx * dx + dy * dy;
        edgeCount += 1;
      }
    }
  }

  const meanLuma = sum / total;
  const variance = sumSq / total - meanLuma * meanLuma;
  const contrast = Math.sqrt(Math.max(variance, 0));
  const sharpness = edgeCount ? edgeSum / edgeCount : 0;

  return { meanLuma, contrast, sharpness };
}

/**
 * Analyze a clothing photo for resolution, lighting, contrast, and blur.
 * Soft gate: blockers are severe issues; warnings are advisory.
 */
export async function analyzeImageQuality(
  uri: string,
  originalSize?: { width?: number; height?: number },
): Promise<ImageQualityReport> {
  const width = originalSize?.width ?? 0;
  const height = originalSize?.height ?? 0;
  const issues: QualityIssue[] = [];

  if (width > 0 && height > 0) {
    const minSide = Math.min(width, height);
    if (minSide < 400) {
      issues.push({
        code: 'low_resolution',
        severity: minSide < 240 ? 'blocker' : 'warning',
        message:
          minSide < 240
            ? 'Photo is too small for reliable tagging. Retake closer or use a higher-res image.'
            : 'Resolution is a bit low — AI tags may be less accurate.',
      });
    }
  }

  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: 96 } }],
    {
      compress: 0.85,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!resized.base64) {
    return {
      ok: issues.every((issue) => issue.severity !== 'blocker'),
      score: issues.length ? 70 : 90,
      issues,
      metrics: {
        width,
        height,
        meanLuma: 128,
        contrast: 40,
        sharpness: 200,
      },
    };
  }

  const raw = jpeg.decode(base64ToUint8Array(resized.base64), {
    useTArray: true,
  });
  const { meanLuma, contrast, sharpness } = analyzePixels(
    raw.data as Uint8Array,
    raw.width,
    raw.height,
  );

  if (meanLuma < 45) {
    issues.push({
      code: 'too_dark',
      severity: meanLuma < 28 ? 'blocker' : 'warning',
      message:
        meanLuma < 28
          ? 'Photo is very dark. Move to better light or turn on the flash.'
          : 'Lighting looks dim — try brighter, even light.',
    });
  } else if (meanLuma > 225) {
    issues.push({
      code: 'too_bright',
      severity: meanLuma > 242 ? 'blocker' : 'warning',
      message:
        meanLuma > 242
          ? 'Photo is blown out. Soften the light or step back from direct flash.'
          : 'Image looks washed out — reduce harsh light if you can.',
    });
  }

  if (contrast < 18) {
    issues.push({
      code: 'low_contrast',
      severity: contrast < 10 ? 'blocker' : 'warning',
      message:
        'Low contrast — place the item on a plainer background so details stand out.',
    });
  }

  // Sharpness is mean squared gradient on a 96px-wide image.
  if (sharpness < 90) {
    issues.push({
      code: 'blurry',
      severity: sharpness < 45 ? 'blocker' : 'warning',
      message:
        sharpness < 45
          ? 'Photo looks blurry. Hold steady and retake.'
          : 'A bit soft — a sharper shot will help AI identify fabric and color.',
    });
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'blocker' ? 28 : 12;
  }
  score = Math.max(5, Math.min(100, score));

  return {
    ok: !issues.some((issue) => issue.severity === 'blocker'),
    score,
    issues,
    metrics: {
      width: width || resized.width,
      height: height || resized.height,
      meanLuma,
      contrast,
      sharpness,
    },
  };
}
