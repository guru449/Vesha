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

import { demoUser, mockWardrobe } from '@/data/mockWardrobe';
import type { ClothingItem, UserProfile } from '@/data/types';

type AppContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  items: ClothingItem[];
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
};

const STORAGE_KEYS = {
  auth: 'vesha.auth',
  items: 'vesha.items',
  user: 'vesha.user',
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [items, setItems] = useState<ClothingItem[]>(mockWardrobe);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedItems] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.items),
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
    // Keep auth light for now — signing out still leaves demo entry available.
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
  }, []);

  const value = useMemo(
    () => ({
      ready,
      isAuthenticated,
      user,
      items,
      pendingImageUri,
      setPendingImageUri,
      enterApp,
      signIn,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
    }),
    [
      ready,
      isAuthenticated,
      user,
      items,
      pendingImageUri,
      enterApp,
      signIn,
      signOut,
      updateProfile,
      addItem,
      updateItem,
      deleteItem,
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
