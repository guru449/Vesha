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
import type { ClothingItem, Outfit, UserProfile } from '@/data/types';

type AppContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  items: ClothingItem[];
  outfits: Outfit[];
  pendingImageUri: string | null;
  setPendingImageUri: (uri: string | null) => void;
  /** Dev-friendly: always signed in as demo user. Real auth comes later. */
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
  getItemsForOutfit: (outfit: Outfit) => ClothingItem[];
};

const STORAGE_KEYS = {
  auth: 'vesha.auth',
  items: 'vesha.items',
  outfits: 'vesha.outfits',
  user: 'vesha.user',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ClothingItem[]>(mockWardrobe);
  const [outfits, setOutfits] = useState<Outfit[]>(mockOutfits);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedItems, storedOutfits] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.items),
          AsyncStorage.getItem(STORAGE_KEYS.outfits),
        ]);

        // Auth deferred: boot straight into a demo session for easy testing.
        const nextUser = storedUser ? JSON.parse(storedUser) : demoUser;
        setUser(nextUser);
        setIsAuthenticated(true);
        await AsyncStorage.multiSet([
          [STORAGE_KEYS.auth, '1'],
          [STORAGE_KEYS.user, JSON.stringify(nextUser)],
        ]);

        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
        if (storedOutfits) {
          setOutfits(JSON.parse(storedOutfits));
        }
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
    // Keep outfits consistent when a piece is removed.
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

  const getItemsForOutfit = useCallback(
    (outfit: Outfit) =>
      outfit.itemIds
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
      getItemsForOutfit,
    }),
    [
      ready,
      isAuthenticated,
      user,
      items,
      outfits,
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
      getItemsForOutfit,
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
