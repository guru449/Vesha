import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { mockOutfits } from '@/data/mockOutfits';
import { demoUser, mockWardrobe } from '@/data/mockWardrobe';
import { mockWearHistory } from '@/data/mockWearHistory';
import type {
  ClothingItem,
  Outfit,
  UserProfile,
  WearHistoryEntry,
} from '@/data/types';
import * as cloud from '@/lib/cloudData';
import { isNewerOrSameTimestamp } from '@/lib/wearCalendar';
import {
  getBackendMode,
  getSupabase,
  isSupabaseConfigured,
  type BackendMode,
} from '@/lib/supabase';

type AppContextValue = {
  ready: boolean;
  backendMode: BackendMode;
  isAuthenticated: boolean;
  user: UserProfile | null;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  pendingImageUri: string | null;
  setPendingImageUri: (uri: string | null) => void;
  /** Local demo only — enter without credentials */
  enterApp: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    name: string;
    heightCm?: number;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addItem: (item: ClothingItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addOutfit: (outfit: Outfit) => Promise<void>;
  updateOutfit: (id: string, patch: Partial<Outfit>) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  markOutfitWorn: (
    outfitId: string,
    snapshot?: Outfit,
    options?: { wornAt?: string },
  ) => Promise<void>;
  markItemWorn: (
    itemId: string,
    options?: { wornAt?: string },
  ) => Promise<void>;
  getItemsForOutfit: (outfit: Outfit) => ClothingItem[];
  getItemsByIds: (ids: string[]) => ClothingItem[];
  getItemWearStats: (itemId: string) => {
    wearCount: number;
    lastWornAt?: string;
  };
};

const STORAGE_KEYS = {
  auth: 'vesha.auth',
  items: 'vesha.items',
  outfits: 'vesha.outfits',
  wearHistory: 'vesha.wearHistory',
  user: 'vesha.user',
};

const AppContext = createContext<AppContextValue | null>(null);

async function loadLocalState(): Promise<{
  user: UserProfile;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
}> {
  const [storedUser, storedItems, storedOutfits, storedHistory] =
    await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.user),
      AsyncStorage.getItem(STORAGE_KEYS.items),
      AsyncStorage.getItem(STORAGE_KEYS.outfits),
      AsyncStorage.getItem(STORAGE_KEYS.wearHistory),
    ]);

  return {
    user: storedUser ? JSON.parse(storedUser) : demoUser,
    items: storedItems ? JSON.parse(storedItems) : mockWardrobe,
    outfits: storedOutfits ? JSON.parse(storedOutfits) : mockOutfits,
    wearHistory: storedHistory ? JSON.parse(storedHistory) : mockWearHistory,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const backendMode = getBackendMode();
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [wearHistory, setWearHistory] = useState<WearHistoryEntry[]>([]);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const hydrateCloudUser = useCallback(async (userId: string, email: string) => {
    let profile = await cloud.fetchProfile(userId);
    if (!profile) {
      profile = {
        id: userId,
        name: email.split('@')[0] || 'Vesha user',
        email,
        stylePreferences: [],
      };
      await cloud.upsertProfile(userId, profile);
    }
    const wardrobe = await cloud.fetchWardrobe(userId);
    userIdRef.current = userId;
    setUser(profile);
    setItems(wardrobe.items);
    setOutfits(wardrobe.outfits);
    setWearHistory(wardrobe.wearHistory);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        if (!isSupabaseConfigured()) {
          const local = await loadLocalState();
          setUser(local.user);
          setItems(local.items);
          setOutfits(local.outfits);
          setWearHistory(local.wearHistory);
          setIsAuthenticated(true);
          userIdRef.current = local.user.id;
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.auth, '1'],
            [STORAGE_KEYS.user, JSON.stringify(local.user)],
          ]);
          return;
        }

        const client = getSupabase();
        if (!client) return;

        const { data } = await client.auth.getSession();
        if (data.session?.user) {
          await hydrateCloudUser(
            data.session.user.id,
            data.session.user.email ?? '',
          );
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setItems([]);
          setOutfits([]);
          setWearHistory([]);
          userIdRef.current = null;
        }

        const { data: sub } = client.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_OUT' || !session?.user) {
              setIsAuthenticated(false);
              setUser(null);
              setItems([]);
              setOutfits([]);
              setWearHistory([]);
              userIdRef.current = null;
              return;
            }
            if (
              event === 'SIGNED_IN' ||
              event === 'TOKEN_REFRESHED' ||
              event === 'INITIAL_SESSION'
            ) {
              // Avoid double-load on first mount; SIGNED_IN handles login/register.
              if (event === 'INITIAL_SESSION' && userIdRef.current) return;
              if (event === 'TOKEN_REFRESHED' && userIdRef.current) return;
              try {
                await hydrateCloudUser(
                  session.user.id,
                  session.user.email ?? '',
                );
              } catch (error) {
                console.warn('Failed to hydrate cloud user', error);
              }
            }
          },
        );
        unsubscribe = () => sub.subscription.unsubscribe();
      } finally {
        setReady(true);
      }
    })();

    return () => unsubscribe?.();
  }, [hydrateCloudUser]);

  const enterApp = useCallback(async () => {
    if (isSupabaseConfigured()) {
      throw new Error('Demo continue is only available in local mode');
    }
    const local = await loadLocalState();
    setUser(local.user);
    setItems(local.items);
    setOutfits(local.outfits);
    setWearHistory(local.wearHistory);
    setIsAuthenticated(true);
    userIdRef.current = local.user.id;
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.auth, '1'],
      [STORAGE_KEYS.user, JSON.stringify(local.user)],
    ]);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const trimmed = email.trim();
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      if (!client) throw new Error('Supabase is not configured');
      const { data, error } = await client.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign in failed');
      await hydrateCloudUser(data.user.id, data.user.email ?? trimmed);
      return;
    }

    const nextUser: UserProfile = {
      ...demoUser,
      email: trimmed || demoUser.email,
    };
    setUser(nextUser);
    setIsAuthenticated(true);
    userIdRef.current = nextUser.id;
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.auth, '1'],
      [STORAGE_KEYS.user, JSON.stringify(nextUser)],
    ]);
  }, [hydrateCloudUser]);

  const signUp = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      heightCm?: number;
    }) => {
      const email = input.email.trim();
      const name = input.name.trim() || 'Vesha user';

      if (isSupabaseConfigured()) {
        const client = getSupabase();
        if (!client) throw new Error('Supabase is not configured');
        if (input.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        const { data, error } = await client.auth.signUp({
          email,
          password: input.password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (!data.user) {
          throw new Error(
            'Check your email to confirm the account, then sign in.',
          );
        }
        const profile: UserProfile = {
          id: data.user.id,
          name,
          email,
          heightCm: input.heightCm,
          stylePreferences: [],
        };
        await cloud.upsertProfile(data.user.id, profile);
        // If email confirmation is required, session may be null.
        if (data.session) {
          await hydrateCloudUser(data.user.id, email);
        } else {
          throw new Error(
            'Account created. Confirm your email, then sign in.',
          );
        }
        return;
      }

      const nextUser: UserProfile = {
        ...demoUser,
        id: `user-${Date.now()}`,
        email: email || 'new@vesha.app',
        name,
        heightCm: input.heightCm,
      };
      setUser(nextUser);
      setIsAuthenticated(true);
      userIdRef.current = nextUser.id;
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.auth, '1'],
        [STORAGE_KEYS.user, JSON.stringify(nextUser)],
      ]);
    },
    [hydrateCloudUser],
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const client = getSupabase();
      await client?.auth.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
    setItems([]);
    setOutfits([]);
    setWearHistory([]);
    userIdRef.current = null;
    await AsyncStorage.setItem(STORAGE_KEYS.auth, '0');
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      const uid = userIdRef.current;
      if (isSupabaseConfigured() && uid) {
        void cloud.upsertProfile(uid, next).catch((error) => {
          console.warn('Profile sync failed', error);
        });
      } else {
        void AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const persistItemsLocal = (next: ClothingItem[]) => {
    void AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
  };
  const persistOutfitsLocal = (next: Outfit[]) => {
    void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
  };
  const persistWearLocal = (next: WearHistoryEntry[]) => {
    void AsyncStorage.setItem(STORAGE_KEYS.wearHistory, JSON.stringify(next));
  };

  const addItem = useCallback(async (item: ClothingItem) => {
    setItems((current) => {
      const next = [item, ...current];
      if (!isSupabaseConfigured()) persistItemsLocal(next);
      return next;
    });
    setPendingImageUri(null);
    const uid = userIdRef.current;
    if (isSupabaseConfigured() && uid) {
      await cloud.insertItem(uid, item);
    }
  }, []);

  const updateItem = useCallback(
    async (id: string, patch: Partial<ClothingItem>) => {
      setItems((current) => {
        const next = current.map((item) =>
          item.id === id
            ? {
                ...item,
                ...patch,
                attributes: { ...item.attributes, ...patch.attributes },
              }
            : item,
        );
        if (!isSupabaseConfigured()) persistItemsLocal(next);
        return next;
      });
      const uid = userIdRef.current;
      if (isSupabaseConfigured() && uid) {
        await cloud.patchItem(uid, id, patch);
      }
    },
    [],
  );

  const deleteItem = useCallback(async (id: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      if (!isSupabaseConfigured()) persistItemsLocal(next);
      return next;
    });
    setOutfits((current) => {
      const next = current.map((outfit) => ({
        ...outfit,
        itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
        updatedAt: new Date().toISOString(),
      }));
      if (!isSupabaseConfigured()) persistOutfitsLocal(next);
      return next;
    });
    const uid = userIdRef.current;
    if (isSupabaseConfigured() && uid) {
      await cloud.removeItem(uid, id);
    }
  }, []);

  const addOutfit = useCallback(async (outfit: Outfit) => {
    setOutfits((current) => {
      const next = [outfit, ...current];
      if (!isSupabaseConfigured()) persistOutfitsLocal(next);
      return next;
    });
    const uid = userIdRef.current;
    if (isSupabaseConfigured() && uid) {
      await cloud.insertOutfit(uid, outfit);
    }
  }, []);

  const updateOutfit = useCallback(
    async (id: string, patch: Partial<Outfit>) => {
      setOutfits((current) => {
        const next = current.map((outfit) =>
          outfit.id === id
            ? {
                ...outfit,
                ...patch,
                updatedAt: new Date().toISOString(),
              }
            : outfit,
        );
        if (!isSupabaseConfigured()) persistOutfitsLocal(next);
        return next;
      });
      const uid = userIdRef.current;
      if (isSupabaseConfigured() && uid) {
        await cloud.patchOutfit(uid, id, patch);
      }
    },
    [],
  );

  const deleteOutfit = useCallback(async (id: string) => {
    setOutfits((current) => {
      const next = current.filter((outfit) => outfit.id !== id);
      if (!isSupabaseConfigured()) persistOutfitsLocal(next);
      return next;
    });
    const uid = userIdRef.current;
    if (isSupabaseConfigured() && uid) {
      await cloud.removeOutfit(uid, id);
    }
  }, []);

  const markOutfitWorn = useCallback(
    async (
      outfitId: string,
      snapshot?: Outfit,
      options?: { wornAt?: string },
    ) => {
      const outfit =
        snapshot || outfits.find((item) => item.id === outfitId);
      if (!outfit) return;

      const wornAt = options?.wornAt ?? new Date().toISOString();
      const entry: WearHistoryEntry = {
        id: `wear-${Date.now()}`,
        outfitId: outfit.id,
        outfitName: outfit.name,
        itemIds: outfit.itemIds,
        wornAt,
        occasion: outfit.occasion,
        source: 'outfit',
      };

      setOutfits((current) => {
        const exists = current.some((item) => item.id === outfitId);
        const next = exists
          ? current.map((item) => {
              if (item.id !== outfitId) return item;
              const bumpLast = isNewerOrSameTimestamp(wornAt, item.lastWornAt);
              return {
                ...item,
                lastWornAt: bumpLast ? wornAt : item.lastWornAt,
                updatedAt: new Date().toISOString(),
              };
            })
          : [
              {
                ...outfit,
                lastWornAt: wornAt,
                updatedAt: new Date().toISOString(),
              },
              ...current,
            ];
        if (!isSupabaseConfigured()) persistOutfitsLocal(next);
        return next;
      });

      setItems((current) => {
        const next = current.map((item) => {
          if (!outfit.itemIds.includes(item.id)) return item;
          if (!isNewerOrSameTimestamp(wornAt, item.lastWornAt)) return item;
          return { ...item, lastWornAt: wornAt };
        });
        if (!isSupabaseConfigured()) persistItemsLocal(next);
        return next;
      });

      setWearHistory((current) => {
        const next = [entry, ...current];
        if (!isSupabaseConfigured()) persistWearLocal(next);
        return next;
      });

      const uid = userIdRef.current;
      if (isSupabaseConfigured() && uid) {
        const existingOutfit = outfits.find((item) => item.id === outfitId);
        const existsRemote = Boolean(existingOutfit);
        const bumpOutfitLast = isNewerOrSameTimestamp(
          wornAt,
          existingOutfit?.lastWornAt ?? outfit.lastWornAt,
        );
        if (!existsRemote && snapshot) {
          await cloud.insertOutfit(uid, {
            ...outfit,
            lastWornAt: wornAt,
            updatedAt: new Date().toISOString(),
          });
        } else if (bumpOutfitLast) {
          await cloud.patchOutfit(uid, outfitId, {
            lastWornAt: wornAt,
          });
        }
        await Promise.all(
          outfit.itemIds.map(async (itemId) => {
            const piece = items.find((entry) => entry.id === itemId);
            if (!isNewerOrSameTimestamp(wornAt, piece?.lastWornAt)) return;
            await cloud.patchItem(uid, itemId, { lastWornAt: wornAt });
          }),
        );
        await cloud.insertWearEntry(uid, entry);
      }
    },
    [outfits, items],
  );

  const markItemWorn = useCallback(
    async (itemId: string, options?: { wornAt?: string }) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item) return;

      const wornAt = options?.wornAt ?? new Date().toISOString();
      const entry: WearHistoryEntry = {
        id: `wear-item-${Date.now()}`,
        outfitName: item.name,
        itemIds: [item.id],
        wornAt,
        occasion: item.attributes.occasion,
        source: 'item',
      };

      const bumpLast = isNewerOrSameTimestamp(wornAt, item.lastWornAt);

      setItems((current) => {
        const next = current.map((piece) => {
          if (piece.id !== itemId) return piece;
          if (!isNewerOrSameTimestamp(wornAt, piece.lastWornAt)) return piece;
          return { ...piece, lastWornAt: wornAt };
        });
        if (!isSupabaseConfigured()) persistItemsLocal(next);
        return next;
      });

      setWearHistory((current) => {
        const next = [entry, ...current];
        if (!isSupabaseConfigured()) persistWearLocal(next);
        return next;
      });

      const uid = userIdRef.current;
      if (isSupabaseConfigured() && uid) {
        if (bumpLast) {
          await cloud.patchItem(uid, itemId, { lastWornAt: wornAt });
        }
        await cloud.insertWearEntry(uid, entry);
      }
    },
    [items],
  );

  const getItemWearStats = useCallback(
    (itemId: string) => {
      let wearCount = 0;
      let lastWornAt: string | undefined;
      for (const entry of wearHistory) {
        if (!entry.itemIds.includes(itemId)) continue;
        wearCount += 1;
        if (
          !lastWornAt ||
          new Date(entry.wornAt).getTime() > new Date(lastWornAt).getTime()
        ) {
          lastWornAt = entry.wornAt;
        }
      }
      const item = items.find((piece) => piece.id === itemId);
      if (item?.lastWornAt) {
        if (
          !lastWornAt ||
          new Date(item.lastWornAt).getTime() > new Date(lastWornAt).getTime()
        ) {
          lastWornAt = item.lastWornAt;
        }
      }
      return { wearCount, lastWornAt };
    },
    [wearHistory, items],
  );

  const getItemsForOutfit = useCallback(
    (outfit: Outfit) =>
      outfit.itemIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is ClothingItem => Boolean(item)),
    [items],
  );

  const getItemsByIds = useCallback(
    (ids: string[]) =>
      ids
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is ClothingItem => Boolean(item)),
    [items],
  );

  const value = useMemo(
    () => ({
      ready,
      backendMode,
      isAuthenticated,
      user,
      items,
      outfits,
      wearHistory,
      pendingImageUri,
      setPendingImageUri,
      enterApp,
      signIn,
      signUp,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      markOutfitWorn,
      markItemWorn,
      getItemsForOutfit,
      getItemsByIds,
      getItemWearStats,
    }),
    [
      ready,
      backendMode,
      isAuthenticated,
      user,
      items,
      outfits,
      wearHistory,
      pendingImageUri,
      enterApp,
      signIn,
      signUp,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      markOutfitWorn,
      markItemWorn,
      getItemsForOutfit,
      getItemsByIds,
      getItemWearStats,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
