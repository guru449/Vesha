import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useApp } from '@/context/AppContext';
import { colors, spacing } from '@/constants/theme';

export default function RegisterScreen() {
  const { signUp, backendMode } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    setError(message);
    if (Platform.OS !== 'web') {
      Alert.alert('Could not create account', message);
    }
  };

  const onRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      await signUp({
        email: email.trim(),
        password,
        name: name.trim() || 'New User',
        heightCm: height ? Number(height) : undefined,
      });
      router.replace('/(tabs)/today');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Please try again.';
      // Email-confirm flow is success-ish — send them to login.
      if (message.toLowerCase().includes('confirm your email')) {
        showError(message);
        router.replace('/(auth)/login');
        return;
      }
      showError(message);
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
          <Text variant="title">Create your closet</Text>
          <Text variant="body" color={colors.muted}>
            {backendMode === 'cloud'
              ? 'Your wardrobe syncs across devices once you create an account.'
              : 'A quick profile helps personalize your wardrobe later.'}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
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
            placeholder="At least 6 characters"
          />
          <Input
            label="Height (cm) — optional"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            placeholder="168"
          />
          {error ? (
            <Text variant="caption" color={colors.danger}>
              {error}
            </Text>
          ) : null}
          <Button
            label={loading ? 'Creating…' : 'Get started'}
            onPress={onRegister}
            disabled={loading || !email.trim() || !password}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color={colors.muted}>
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text variant="bodyMedium" color={colors.primary}>
                Sign in
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
    paddingTop: spacing.xl,
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
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  },
});
