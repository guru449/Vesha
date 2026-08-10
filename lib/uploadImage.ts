import { Platform } from 'react-native';

import { persistWardrobeImage } from '@/lib/persistImage';
import { getSupabase, isSupabaseConfigured, WARDROBE_BUCKET } from '@/lib/supabase';

function guessExtension(uri: string): string {
  const cleaned = uri.split('?')[0]?.toLowerCase() ?? '';
  if (cleaned.endsWith('.png')) return 'png';
  if (cleaned.endsWith('.webp')) return 'webp';
  if (cleaned.endsWith('.heic')) return 'heic';
  return 'jpg';
}

function contentTypeFor(ext: string): string {
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  return 'image/jpeg';
}

/**
 * Persist a wardrobe photo.
 * - Cloud mode: upload to Supabase Storage, return public URL
 * - Local mode: copy into app document storage (native) / keep URI (web)
 */
export async function saveWardrobeImage(
  sourceUri: string,
  userId?: string | null,
): Promise<string> {
  if (!isSupabaseConfigured() || !userId) {
    return persistWardrobeImage(sourceUri);
  }

  const client = getSupabase();
  if (!client) return persistWardrobeImage(sourceUri);

  // Already a remote URL — keep as-is (demo Unsplash, prior uploads).
  if (sourceUri.startsWith('https://') || sourceUri.startsWith('http://')) {
    return sourceUri;
  }

  const ext = guessExtension(sourceUri);
  const path = `${userId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;

  let body: Blob | ArrayBuffer;
  let contentType = contentTypeFor(ext);

  if (Platform.OS === 'web') {
    const response = await fetch(sourceUri);
    body = await response.blob();
    contentType = body.type || contentType;
  } else {
    const response = await fetch(sourceUri);
    body = await response.blob();
    contentType = body.type || contentType;
  }

  const { error } = await client.storage
    .from(WARDROBE_BUCKET)
    .upload(path, body, {
      contentType,
      upsert: false,
    });

  if (error) {
    // Fall back to local persistence so the user can still save the item.
    console.warn('Cloud upload failed, using local image URI', error.message);
    return persistWardrobeImage(sourceUri);
  }

  const { data } = client.storage.from(WARDROBE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
