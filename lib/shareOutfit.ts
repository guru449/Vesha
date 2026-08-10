import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { ClothingItem, Outfit } from '@/data/types';

export function buildOutfitShareMessage(
  outfit: Pick<Outfit, 'name' | 'occasion'>,
  pieces: ClothingItem[],
): string {
  const pieceLine = pieces
    .slice(0, 6)
    .map((item) => `• ${item.name}`)
    .join('\n');
  const occasion = outfit.occasion ? `${outfit.occasion} look` : 'Outfit';
  return [`${outfit.name}`, occasion, '', pieceLine, '', 'Shared from Vesha']
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n')
    .trim();
}

function normalizeFileUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) return uri;
  if (uri.startsWith('/')) return `file://${uri}`;
  return uri;
}

/**
 * Capture a share card view and open the system share sheet
 * (WhatsApp, Messages, Gmail, etc. — whatever the OS offers).
 */
export async function shareOutfitCard(options: {
  viewRef: RefObject<View | null>;
  outfit: Pick<Outfit, 'name' | 'occasion'>;
  pieces: ClothingItem[];
}): Promise<'shared' | 'dismissed' | 'unavailable'> {
  const message = buildOutfitShareMessage(options.outfit, options.pieces);

  if (Platform.OS === 'web') {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: options.outfit.name,
          text: message,
        });
        return 'shared';
      }
      await Share.share({ title: options.outfit.name, message });
      return 'shared';
    } catch {
      return 'dismissed';
    }
  }

  // Give images a beat to paint into the off-screen card.
  await new Promise((resolve) => setTimeout(resolve, 80));

  let imageUri: string | null = null;
  try {
    if (options.viewRef.current) {
      imageUri = await captureRef(options.viewRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
      });
      imageUri = normalizeFileUri(imageUri);
    }
  } catch {
    imageUri = null;
  }

  try {
    if (Platform.OS === 'ios') {
      const result = await Share.share(
        imageUri
          ? { title: options.outfit.name, message, url: imageUri }
          : { title: options.outfit.name, message },
      );
      return result.action === Share.sharedAction ? 'shared' : 'dismissed';
    }

    if (imageUri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpeg',
        dialogTitle: `Share ${options.outfit.name}`,
        UTI: 'public.jpeg',
      });
      return 'shared';
    }

    const result = await Share.share({
      title: options.outfit.name,
      message,
    });
    return result.action === Share.sharedAction ? 'shared' : 'dismissed';
  } catch {
    return 'dismissed';
  }
}
