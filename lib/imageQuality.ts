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
    /** Laplacian variance — higher = sharper */
    sharpness: number;
  };
};

/** Tuned on downscaled ~160px-wide JPEGs */
const THRESHOLDS = {
  darkWarning: 55,
  darkBlocker: 32,
  brightWarning: 215,
  brightBlocker: 238,
  contrastWarning: 22,
  contrastBlocker: 12,
  // Laplacian variance on 160px images: soft phone shots often land 40–120
  sharpWarning: 140,
  sharpBlocker: 55,
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
  let lapSum = 0;
  let lapSumSq = 0;
  let lapCount = 0;
  const total = width * height;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const luma = lumaAt(data, width, x, y);
      sum += luma;
      sumSq += luma * luma;

      if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
        const lap =
          4 * luma -
          lumaAt(data, width, x - 1, y) -
          lumaAt(data, width, x + 1, y) -
          lumaAt(data, width, x, y - 1) -
          lumaAt(data, width, x, y + 1);
        lapSum += lap;
        lapSumSq += lap * lap;
        lapCount += 1;
      }
    }
  }

  const meanLuma = sum / total;
  const variance = sumSq / total - meanLuma * meanLuma;
  const contrast = Math.sqrt(Math.max(variance, 0));
  const lapMean = lapCount ? lapSum / lapCount : 0;
  const sharpness = lapCount
    ? Math.max(0, lapSumSq / lapCount - lapMean * lapMean)
    : 0;

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
    if (minSide < 480) {
      issues.push({
        code: 'low_resolution',
        severity: minSide < 280 ? 'blocker' : 'warning',
        message:
          minSide < 280
            ? 'Photo is too small for reliable tagging. Retake closer or use a higher-res image.'
            : 'Resolution is a bit low — AI tags may be less accurate.',
      });
    }
  }

  const resized = await manipulateAsync(
    uri,
    [{ resize: { width: 160 } }],
    {
      compress: 0.92,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!resized.base64) {
    // Can't decode pixels — keep resolution issues only; don't fake a perfect score.
    return {
      ok: !issues.some((issue) => issue.severity === 'blocker'),
      score: Math.max(40, 80 - issues.length * 12),
      issues: [
        ...issues,
        {
          code: 'blurry',
          severity: 'warning',
          message:
            'Could not fully analyze sharpness on this device. Double-check the photo looks clear.',
        },
      ],
      metrics: {
        width,
        height,
        meanLuma: 0,
        contrast: 0,
        sharpness: 0,
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

  if (meanLuma < THRESHOLDS.darkWarning) {
    issues.push({
      code: 'too_dark',
      severity:
        meanLuma < THRESHOLDS.darkBlocker ? 'blocker' : 'warning',
      message:
        meanLuma < THRESHOLDS.darkBlocker
          ? 'Photo is very dark. Move to better light or turn on the flash.'
          : 'Lighting looks dim — try brighter, even light.',
    });
  } else if (meanLuma > THRESHOLDS.brightWarning) {
    issues.push({
      code: 'too_bright',
      severity:
        meanLuma > THRESHOLDS.brightBlocker ? 'blocker' : 'warning',
      message:
        meanLuma > THRESHOLDS.brightBlocker
          ? 'Photo is blown out. Soften the light or step back from direct flash.'
          : 'Image looks washed out — reduce harsh light if you can.',
    });
  }

  if (contrast < THRESHOLDS.contrastWarning) {
    issues.push({
      code: 'low_contrast',
      severity:
        contrast < THRESHOLDS.contrastBlocker ? 'blocker' : 'warning',
      message:
        'Low contrast — place the item on a plainer background so details stand out.',
    });
  }

  if (sharpness < THRESHOLDS.sharpWarning) {
    issues.push({
      code: 'blurry',
      severity:
        sharpness < THRESHOLDS.sharpBlocker ? 'blocker' : 'warning',
      message:
        sharpness < THRESHOLDS.sharpBlocker
          ? 'Photo looks blurry. Hold steady and retake.'
          : 'A bit soft — a sharper shot will help AI identify fabric and color.',
    });
  }

  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'blocker' ? 28 : 12;
  }
  // Nudge score with continuous metrics so “almost blurry” isn’t always 100.
  if (!issues.some((i) => i.code === 'blurry') && sharpness < 220) {
    score -= 4;
  }
  if (
    !issues.some((i) => i.code === 'too_dark' || i.code === 'too_bright') &&
    (meanLuma < 70 || meanLuma > 200)
  ) {
    score -= 3;
  }
  score = Math.max(5, Math.min(100, Math.round(score)));

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
