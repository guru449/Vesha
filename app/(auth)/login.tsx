import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn } = useApp();
  const [email, setEmail] = useState('ava@vesha.app');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      await signIn(email.trim() || 'ava@vesha.app');
      router.replace('/(tabs)/wardrobe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.content}>
        <View style={styles.header}>
          <Text variant="brand" color={colors.primary}>
            Vesha
          </Text>
          <Text variant="title">Welcome back</Text>
          <Text variant="body" color={colors.muted}>
            Sign in to open your digital wardrobe.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
          />
          <Input
            label="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
          />
          <Button
            label={loading ? 'Signing in…' : 'Sign in'}
            onPress={onLogin}
            disabled={loading}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color={colors.muted}>
            New here?
          </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable>
              <Text variant="bodyMedium" color={colors.primary}>
                Create an account
              </Text>
            </Pressable>
          </Link>
        </View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  header: {
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
});
