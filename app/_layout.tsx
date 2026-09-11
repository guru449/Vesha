import {
  Fraunces_600SemiBold,
  Fraunces_500Medium,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { PhoneShell } from '@/components/PhoneShell';
import { AppProvider } from '@/context/AppContext';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_500Medium,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <PhoneShell>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="item/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Item',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="add/confirm"
              options={{
                headerShown: true,
                headerTitle: 'Confirm details',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="add/ways"
              options={{
                headerShown: true,
                headerTitle: 'Ways to wear it',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="vibe/index"
              options={{
                headerShown: true,
                headerTitle: 'Vibe Match',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="vibe/result"
              options={{
                headerShown: true,
                headerTitle: 'Your version',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="social/index"
              options={{
                headerShown: true,
                headerTitle: 'Community',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="groups/index"
              options={{
                headerShown: true,
                headerTitle: 'Group outings',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="groups/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Outing',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="outfit/create"
              options={{
                headerShown: true,
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="outfit/tweak"
              options={{
                headerShown: true,
                headerTitle: 'Tweak look',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="outfit/[id]"
              options={{
                headerShown: true,
                headerTitle: 'Outfit',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="insights"
              options={{
                headerShown: true,
                headerTitle: 'Insights',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="health"
              options={{
                headerShown: true,
                headerTitle: 'Wardrobe Health',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="calendar"
              options={{
                headerShown: true,
                headerTitle: 'This week',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                animation: 'slide_from_right',
              }}
            />
            <Stack.Screen
              name="log-wear"
              options={{
                headerShown: true,
                headerTitle: 'Log a look',
                headerTintColor: colors.primary,
                headerStyle: { backgroundColor: colors.bg },
                headerShadowVisible: false,
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
        </PhoneShell>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
