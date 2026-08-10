import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !url.includes('YOUR_') && !anonKey.includes('YOUR_'));
}

export type BackendMode = 'local' | 'cloud';

export function getBackendMode(): BackendMode {
  return isSupabaseConfigured() ? 'cloud' : 'local';
}

let client: SupabaseClient | null = null;

/** Lazily create the Supabase client. Returns null in local demo mode. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export const WARDROBE_BUCKET = 'wardrobe-images';
