import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { colors, radii } from '@/constants/theme';

export default function TabLayout() {
  const { ready, isAuthenticated } = useApp();

  if (ready && !isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: 'PlusJakartaSans_600SemiBold',
          fontSize: 11,
          marginBottom: Platform.OS === 'web' ? 8 : 0,
        },
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'shirt' : 'shirt-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => (
            <View style={StyleSheet.flatten([styles.addIcon, focused && styles.addIconActive])}>
              <Ionicons
                name="add"
                size={24}
                color={focused ? colors.white : colors.primary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: Platform.OS === 'web' ? 72 : 64,
    paddingTop: 6,
  },
  addIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: -2,
  },
  addIconActive: {
    backgroundColor: colors.primary,
  },
});
