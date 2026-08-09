import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Copy a camera/library temp URI into app document storage so wardrobe
 * images still load after navigation / app restarts.
 * On web, return the original URI (blob/http) as-is.
 */
export async function persistWardrobeImage(sourceUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return sourceUri;
  }

  if (!sourceUri || sourceUri.startsWith('http://') || sourceUri.startsWith('https://')) {
    return sourceUri;
  }

  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) {
    return sourceUri;
  }

  const wardrobeDir = `${baseDir}wardrobe/`;
  const dirInfo = await FileSystem.getInfoAsync(wardrobeDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(wardrobeDir, { intermediates: true });
  }

  const extension = guessExtension(sourceUri);
  const filename = `item-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${extension}`;
  const destination = `${wardrobeDir}${filename}`;

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destination,
  });

  return destination;
}

function guessExtension(uri: string): string {
  const cleaned = uri.split('?')[0]?.toLowerCase() ?? '';
  if (cleaned.endsWith('.png')) return 'png';
  if (cleaned.endsWith('.webp')) return 'webp';
  if (cleaned.endsWith('.heic')) return 'heic';
  return 'jpg';
}
