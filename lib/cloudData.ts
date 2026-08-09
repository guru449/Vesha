import type {
  ClothingItem,
  Outfit,
  UserProfile,
  WearHistoryEntry,
} from '@/data/types';
import { getSupabase } from '@/lib/supabase';

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  height_cm: number | null;
  weight_kg: number | null;
  style_preferences: string[] | null;
};

type ItemRow = {
  id: string;
  name: string;
  image_uri: string;
  category: string;
  color: string;
  pattern: string;
  material: string;
  style: string;
  occasion: string;
  brand: string | null;
  notes: string | null;
  ai_confidence: number | null;
  created_at: string;
};

type OutfitRow = {
  id: string;
  name: string;
  occasion: string | null;
  item_ids: string[] | null;
  created_at: string;
  updated_at: string;
  last_worn_at: string | null;
};

type WearRow = {
  id: string;
  outfit_id: string;
  outfit_name: string;
  item_ids: string[] | null;
  worn_at: string;
  occasion: string | null;
};

function requireClient() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase is not configured');
  return client;
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    stylePreferences: row.style_preferences ?? [],
  };
}

function mapItem(row: ItemRow): ClothingItem {
  return {
    id: row.id,
    name: row.name,
    imageUri: row.image_uri,
    attributes: {
      category: row.category as ClothingItem['attributes']['category'],
      color: row.color,
      pattern: row.pattern,
      material: row.material,
      style: row.style,
      occasion: row.occasion,
      brand: row.brand ?? undefined,
    },
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    aiConfidence: row.ai_confidence ?? undefined,
  };
}

function mapOutfit(row: OutfitRow): Outfit {
  return {
    id: row.id,
    name: row.name,
    occasion: row.occasion ?? undefined,
    itemIds: row.item_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastWornAt: row.last_worn_at ?? undefined,
  };
}

function mapWear(row: WearRow): WearHistoryEntry {
  return {
    id: row.id,
    outfitId: row.outfit_id,
    outfitName: row.outfit_name,
    itemIds: row.item_ids ?? [],
    wornAt: row.worn_at,
    occasion: row.occasion ?? undefined,
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const client = requireClient();
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProfile(data as ProfileRow) : null;
}

export async function upsertProfile(
  userId: string,
  profile: UserProfile,
): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('profiles').upsert({
    id: userId,
    name: profile.name,
    email: profile.email,
    height_cm: profile.heightCm ?? null,
    weight_kg: profile.weightKg ?? null,
    style_preferences: profile.stylePreferences ?? [],
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchWardrobe(userId: string): Promise<{
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
}> {
  const client = requireClient();
  const [itemsRes, outfitsRes, wearRes] = await Promise.all([
    client
      .from('clothing_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    client
      .from('outfits')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }),
    client
      .from('wear_history')
      .select('*')
      .eq('user_id', userId)
      .order('worn_at', { ascending: false }),
  ]);

  if (itemsRes.error) throw itemsRes.error;
  if (outfitsRes.error) throw outfitsRes.error;
  if (wearRes.error) throw wearRes.error;

  return {
    items: ((itemsRes.data ?? []) as ItemRow[]).map(mapItem),
    outfits: ((outfitsRes.data ?? []) as OutfitRow[]).map(mapOutfit),
    wearHistory: ((wearRes.data ?? []) as WearRow[]).map(mapWear),
  };
}

export async function insertItem(
  userId: string,
  item: ClothingItem,
): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('clothing_items').insert({
    id: item.id,
    user_id: userId,
    name: item.name,
    image_uri: item.imageUri,
    category: item.attributes.category,
    color: item.attributes.color,
    pattern: item.attributes.pattern,
    material: item.attributes.material,
    style: item.attributes.style,
    occasion: item.attributes.occasion,
    brand: item.attributes.brand ?? null,
    notes: item.notes ?? null,
    ai_confidence: item.aiConfidence ?? null,
    created_at: item.createdAt,
  });
  if (error) throw error;
}

export async function patchItem(
  userId: string,
  id: string,
  patch: Partial<ClothingItem>,
): Promise<void> {
  const client = requireClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.imageUri !== undefined) row.image_uri = patch.imageUri;
  if (patch.notes !== undefined) row.notes = patch.notes ?? null;
  if (patch.aiConfidence !== undefined) {
    row.ai_confidence = patch.aiConfidence ?? null;
  }
  if (patch.attributes) {
    const a = patch.attributes;
    if (a.category !== undefined) row.category = a.category;
    if (a.color !== undefined) row.color = a.color;
    if (a.pattern !== undefined) row.pattern = a.pattern;
    if (a.material !== undefined) row.material = a.material;
    if (a.style !== undefined) row.style = a.style;
    if (a.occasion !== undefined) row.occasion = a.occasion;
    if (a.brand !== undefined) row.brand = a.brand ?? null;
  }
  if (!Object.keys(row).length) return;
  const { error } = await client
    .from('clothing_items')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeItem(userId: string, id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('clothing_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function insertOutfit(
  userId: string,
  outfit: Outfit,
): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('outfits').insert({
    id: outfit.id,
    user_id: userId,
    name: outfit.name,
    occasion: outfit.occasion ?? null,
    item_ids: outfit.itemIds,
    created_at: outfit.createdAt,
    updated_at: outfit.updatedAt,
    last_worn_at: outfit.lastWornAt ?? null,
  });
  if (error) throw error;
}

export async function patchOutfit(
  userId: string,
  id: string,
  patch: Partial<Outfit>,
): Promise<void> {
  const client = requireClient();
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.occasion !== undefined) row.occasion = patch.occasion ?? null;
  if (patch.itemIds !== undefined) row.item_ids = patch.itemIds;
  if (patch.lastWornAt !== undefined) {
    row.last_worn_at = patch.lastWornAt ?? null;
  }
  const { error } = await client
    .from('outfits')
    .update(row)
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function removeOutfit(userId: string, id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client
    .from('outfits')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function insertWearEntry(
  userId: string,
  entry: WearHistoryEntry,
): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('wear_history').insert({
    id: entry.id,
    user_id: userId,
    outfit_id: entry.outfitId,
    outfit_name: entry.outfitName,
    item_ids: entry.itemIds,
    worn_at: entry.wornAt,
    occasion: entry.occasion ?? null,
  });
  if (error) throw error;
}
