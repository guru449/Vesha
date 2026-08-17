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
  /** Color-only offline assist (no garment-type guessing) */
  colorAssist?: boolean;
  /** Prefer mock even if cloud AI is available */
  forceMock?: boolean;
};

export type LiveAiStatus =
  | { ready: true }
  | { ready: false; reason: 'not_configured' | 'invoke_failed'; detail?: string };

export function getLiveAiConfigStatus(): LiveAiStatus {
  if (!isSupabaseConfigured()) {
    return { ready: false, reason: 'not_configured' };
  }
  return { ready: true };
}

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
): Promise<{ result: AiIdentifyResult | null; detail?: string }> {
  const client = getSupabase();
  if (!client) {
    return { result: null, detail: 'Supabase is not configured' };
  }

  const body: Record<string, string> = {};
  if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
    body.imageUrl = imageUri;
  } else {
    const encoded = await uriToBase64(imageUri);
    if (!encoded) {
      return { result: null, detail: 'Could not read the photo for upload' };
    }
    body.imageBase64 = encoded.base64;
    body.mimeType = encoded.mimeType;
  }

  const { data, error } = await client.functions.invoke('identify-clothing', {
    body,
  });

  if (error) {
    console.warn('identify-clothing edge function error', error.message);
    return {
      result: null,
      detail:
        error.message ||
        'Edge function failed. Deploy identify-clothing and set OPENAI_API_KEY.',
    };
  }

  if (data?.error) {
    return {
      result: null,
      detail: String(data.error),
    };
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
    return {
      result: null,
      detail: 'Unexpected response from vision AI',
    };
  }

  return { result: withImageUri(result, imageUri) };
}

/**
 * Identify clothing in a photo.
 * Default path is live Supabase Edge Function + OpenAI vision.
 * Color assist is opt-in only (no garment-type invention).
 */
export async function identifyClothing(
  imageUri: string,
  options?: IdentifyOptions,
): Promise<
  AiIdentifyResult & {
    source: 'ai' | 'mock' | 'color';
    liveError?: string;
  }
> {
  if (options?.forceNoMatch) {
    return {
      ...mockAiIdentify(imageUri, { forceNoMatch: true }),
      source: 'mock',
    };
  }

  if (options?.colorAssist || options?.forceMock) {
    const heuristic = await heuristicIdentifyFromImage(imageUri);
    return {
      ...heuristic,
      source: 'color',
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      matched: false,
      imageUri,
      confidence: 0,
      reason:
        'Live vision AI is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, deploy identify-clothing, and set OPENAI_API_KEY on Supabase.',
      source: 'mock',
      liveError: 'not_configured',
    };
  }

  try {
    const { result, detail } = await identifyViaEdgeFunction(imageUri);
    if (result) {
      return { ...result, source: 'ai' };
    }
    return {
      matched: false,
      imageUri,
      confidence: 0,
      reason:
        detail ||
        'Live vision AI failed. Check that identify-clothing is deployed and OPENAI_API_KEY is set.',
      source: 'mock',
      liveError: detail,
    };
  } catch (error) {
    console.warn('Live AI identify failed', error);
    const detail =
      error instanceof Error ? error.message : 'Live vision AI failed';
    return {
      matched: false,
      imageUri,
      confidence: 0,
      reason: detail,
      source: 'mock',
      liveError: detail,
    };
  }
}

export function isLiveAiAvailable(): boolean {
  return isSupabaseConfigured();
}
