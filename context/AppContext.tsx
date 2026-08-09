import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type AppContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  items: ClothingItem[];
  outfits: Outfit[];
  wearHistory: WearHistoryEntry[];
  pendingImageUri: string | null;
  setPendingImageUri: (uri: string | null) => void;
  enterApp: () => Promise<void>;
  signIn: (email: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  addItem: (item: ClothingItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  addOutfit: (outfit: Outfit) => Promise<void>;
  updateOutfit: (id: string, patch: Partial<Outfit>) => Promise<void>;
  deleteOutfit: (id: string) => Promise<void>;
  markOutfitWorn: (outfitId: string, snapshot?: Outfit) => Promise<void>;
  getItemsForOutfit: (outfit: Outfit) => ClothingItem[];
  getItemsByIds: (ids: string[]) => ClothingItem[];
};

const STORAGE_KEYS = {
  auth: 'vesha.auth',
  items: 'vesha.items',
  outfits: 'vesha.outfits',
  wearHistory: 'vesha.wearHistory',
  user: 'vesha.user',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ClothingItem[]>(mockWardrobe);
  const [outfits, setOutfits] = useState<Outfit[]>(mockOutfits);
  const [wearHistory, setWearHistory] =
    useState<WearHistoryEntry[]>(mockWearHistory);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedItems, storedOutfits, storedHistory] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.user),
            AsyncStorage.getItem(STORAGE_KEYS.items),
            AsyncStorage.getItem(STORAGE_KEYS.outfits),
            AsyncStorage.getItem(STORAGE_KEYS.wearHistory),
          ]);

        const nextUser = storedUser ? JSON.parse(storedUser) : demoUser;
        setUser(nextUser);
        setIsAuthenticated(true);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.auth, '1'],
          [STORAGE_KEYS.user, JSON.stringify(nextUser)],
        ]);

        if (storedItems) setItems(JSON.parse(storedItems));
        if (storedOutfits) setOutfits(JSON.parse(storedOutfits));
        if (storedHistory) setWearHistory(JSON.parse(storedHistory));
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const enterApp = useCallback(async () => {
    setUser(demoUser);
    setIsAuthenticated(true);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.auth, '1'],
      [STORAGE_KEYS.user, JSON.stringify(demoUser)],
    ]);
  }, []);

  const signIn = useCallback(async (email: string, name?: string) => {
    const nextUser: UserProfile = {
      ...demoUser,
      email,
      name: name?.trim() || demoUser.name,
    };
    setUser(nextUser);
    setIsAuthenticated(true);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.auth, '1'],
      [STORAGE_KEYS.user, JSON.stringify(nextUser)],
    ]);
  }, []);

  const signOut = useCallback(async () => {
    setIsAuthenticated(false);
    setUser(null);
    await AsyncStorage.setItem(STORAGE_KEYS.auth, '0');
  }, []);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      return next;
    });
  }, []);

  const addItem = useCallback(async (item: ClothingItem) => {
    setItems((current) => {
      const next = [item, ...current];
      void AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
      return next;
    });
    setPendingImageUri(null);
  }, []);

  const updateItem = useCallback(async (id: string, patch: Partial<ClothingItem>) => {
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
      void AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    setItems((current) => {
      const next = current.filter((item) => item.id !== id);
      void AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
      return next;
    });
    setOutfits((current) => {
      const next = current.map((outfit) => ({
        ...outfit,
        itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
        updatedAt: new Date().toISOString(),
      }));
      void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
      return next;
    });
  }, []);

  const addOutfit = useCallback(async (outfit: Outfit) => {
    setOutfits((current) => {
      const next = [outfit, ...current];
      void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateOutfit = useCallback(async (id: string, patch: Partial<Outfit>) => {
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
      void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteOutfit = useCallback(async (id: string) => {
    setOutfits((current) => {
      const next = current.filter((outfit) => outfit.id !== id);
      void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
      return next;
    });
  }, []);

  const markOutfitWorn = useCallback(
    async (outfitId: string, snapshot?: Outfit) => {
      const outfit =
        snapshot || outfits.find((item) => item.id === outfitId);
      if (!outfit) return;

      const wornAt = new Date().toISOString();

      setOutfits((current) => {
        const exists = current.some((item) => item.id === outfitId);
        const next = exists
          ? current.map((item) =>
              item.id === outfitId
                ? { ...item, lastWornAt: wornAt, updatedAt: wornAt }
                : item,
            )
          : [{ ...outfit, lastWornAt: wornAt, updatedAt: wornAt }, ...current];
        void AsyncStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(next));
        return next;
      });

      const entry: WearHistoryEntry = {
        id: `wear-${Date.now()}`,
        outfitId: outfit.id,
        outfitName: outfit.name,
        itemIds: outfit.itemIds,
        wornAt,
        occasion: outfit.occasion,
      };

      setWearHistory((current) => {
        const next = [entry, ...current];
        void AsyncStorage.setItem(
          STORAGE_KEYS.wearHistory,
          JSON.stringify(next),
        );
        return next;
      });
    },
    [outfits],
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
      isAuthenticated,
      user,
      items,
      outfits,
      wearHistory,
      pendingImageUri,
      setPendingImageUri,
      enterApp,
      signIn,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      markOutfitWorn,
      getItemsForOutfit,
      getItemsByIds,
    }),
    [
      ready,
      isAuthenticated,
      user,
      items,
      outfits,
      wearHistory,
      pendingImageUri,
      enterApp,
      signIn,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      markOutfitWorn,
      getItemsForOutfit,
      getItemsByIds,
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
