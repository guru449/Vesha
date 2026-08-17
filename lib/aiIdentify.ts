import type { ClothingAttributes } from '@/data/types';
import { mockAiIdentify, type AiIdentifyResult } from '@/data/mockWardrobe';
import { heuristicIdentifyFromImage } from '@/lib/heuristicIdentify';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export type { AiIdentifyResult };

/** Confidence at/above this can use one-tap save (form collapsed). */
export const HIGH_CONFIDENCE = 0.75;

export type IdentifyOptions = {
  /** Force the local mock "no match" path (QA) */
  forceNoMatch?: boolean;
  /** Prefer mock even if cloud AI is available */
  forceMock?: boolean;
};

function guessMime(uri: string): string {
  const cleaned = uri.split('?')[0]?.toLowerCase() ?? '';
  if (cleaned.endsWith('.png')) return 'image/png';
  if (cleaned.endsWith('.webp')) return 'image/webp';
  if (cleaned.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
}

async function uriToBase64(
  uri: string,
): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = blob.type || guessMime(uri);
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    // eslint-disable-next-line no-undef
    const base64 = btoa(binary);
    return { base64, mimeType };
  } catch (error) {
    console.warn('Failed to encode image for AI', error);
    return null;
  }
}

function withImageUri(
  result: Omit<AiIdentifyResult, 'imageUri'> | AiIdentifyResult,
  imageUri: string,
): AiIdentifyResult {
  return { ...result, imageUri } as AiIdentifyResult;
}

async function identifyViaEdgeFunction(
  imageUri: string,
): Promise<AiIdentifyResult | null> {
  const client = getSupabase();
  if (!client) return null;

  const body: Record<string, string> = {};
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    body.imageUrl = imageUri;
  } else {
    const encoded = await uriToBase64(imageUri);
    if (!encoded) return null;
    body.imageBase64 = encoded.base64;
    body.mimeType = encoded.mimeType;
  }

  const { data, error } = await client.functions.invoke('identify-clothing', {
    body,
  });

  if (error) {
    console.warn('identify-clothing edge function error', error.message);
    return null;
  }

  const result = data?.result as
    | {
        matched: true;
        suggestedName: string;
        confidence: number;
        attributes: ClothingAttributes;
      }
    | {
        matched: false;
        confidence: number;
        reason: string;
      }
    | undefined;

  if (!result || typeof result.matched !== 'boolean') {
    console.warn('identify-clothing returned unexpected payload', data);
    return null;
  }

  return withImageUri(result, imageUri);
}

/**
 * Identify clothing in a photo.
 * 1) Supabase Edge Function + OpenAI (when configured & deployed)
 * 2) Local mock fallback (demo / offline / missing keys)
 */
export async function identifyClothing(
  imageUri: string,
  options?: IdentifyOptions,
): Promise<AiIdentifyResult & { source: 'ai' | 'mock' }> {
  if (options?.forceNoMatch) {
    return {
      ...mockAiIdentify(imageUri, { forceNoMatch: true }),
      source: 'mock',
    };
  }

  if (!options?.forceMock && isSupabaseConfigured()) {
    try {
      const live = await identifyViaEdgeFunction(imageUri);
      if (live) {
        return { ...live, source: 'ai' };
      }
    } catch (error) {
      console.warn('Live AI identify failed, using heuristic', error);
    }
  }

  // Local / offline: sample color from the photo instead of a fixed blouse.
  await new Promise((resolve) => setTimeout(resolve, 500));
  const heuristic = await heuristicIdentifyFromImage(imageUri);
  return {
    ...heuristic,
    source: 'mock',
  };
}

export function isLiveAiAvailable(): boolean {
  return isSupabaseConfigured();
}
