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

  useEffect(() => {
    (async () => {
      try {
        const [auth, storedUser, storedItems] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.auth),
          AsyncStorage.getItem(STORAGE_KEYS.user),
          AsyncStorage.getItem(STORAGE_KEYS.items),
        ]);
        if (auth === '1') {
          setIsAuthenticated(true);
          setUser(storedUser ? JSON.parse(storedUser) : demoUser);
        }
        if (storedItems) {
          setItems(JSON.parse(storedItems));
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persistItems = useCallback(async (next: ClothingItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(STORAGE_KEYS.items, JSON.stringify(next));
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

  const updateProfile = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user) return;
      const next = { ...user, ...patch };
      setUser(next);
      await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
    },
    [user],
  );

  const addItem = useCallback(
    async (item: ClothingItem) => {
      await persistItems([item, ...items]);
    },
    [items, persistItems],
  );

  const updateItem = useCallback(
    async (id: string, patch: Partial<ClothingItem>) => {
      const next = items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...patch,
              attributes: { ...item.attributes, ...patch.attributes },
            }
          : item,
      );
      await persistItems(next);
    },
    [items, persistItems],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await persistItems(items.filter((item) => item.id !== id));
    },
    [items, persistItems],
  );

  const value = useMemo(
    () => ({
      ready,
      isAuthenticated,
      user,
      items,
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
