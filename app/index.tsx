import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useApp } from '@/context/AppContext';
import { colors } from '@/constants/theme';

export default function Index() {
  const { ready } = useApp();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Auth deferred — always enter the wardrobe for easy testing.
  return <Redirect href="/(tabs)/wardrobe" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
