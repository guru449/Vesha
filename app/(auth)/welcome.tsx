import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, radii, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  const { enterApp } = useApp();

  const continueDemo = async () => {
    await enterApp();
    router.replace('/(tabs)/wardrobe');
  };

  return (
    <View style={styles.root}>
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80',
        }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />
      <LinearGradient
        colors={[
          'rgba(28,43,38,0.15)',
          'rgba(28,43,38,0.35)',
          'rgba(28,43,38,0.88)',
        ]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(700)} style={styles.brandWrap}>
          <Text variant="brand" color={colors.white} style={styles.brand}>
            Vesha
          </Text>
          <View style={styles.brandRule} />
        </Animated.View>

        <View style={styles.bottom}>
          <Animated.View entering={FadeInUp.delay(180).duration(650)}>
            <Text variant="hero" color={colors.white} style={styles.headline}>
              Your closet,{'\n'}beautifully digitized
            </Text>
            <Text
              variant="body"
              color="rgba(255,255,255,0.82)"
              style={styles.sub}
            >
              Upload pieces, confirm AI tags, and browse a wardrobe that stays
              organized for you.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(320).duration(650)}
            style={styles.actions}
          >
            <Button label="Continue to wardrobe" onPress={continueDemo} />
            <Link href="/(auth)/login" asChild>
              <Button label="Sign in (optional for now)" variant="onDark" />
            </Link>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  safe: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  brandWrap: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  brand: {
    fontSize: 48,
    lineHeight: 54,
  },
  brandRule: {
    width: 48,
    height: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
  },
  bottom: {
    gap: spacing.lg,
  },
  headline: {
    marginBottom: spacing.sm,
  },
  sub: {
    maxWidth: 340,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
