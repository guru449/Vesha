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

export default function RegisterScreen() {
  const { signIn, updateProfile } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);

  const onRegister = async () => {
    setLoading(true);
    try {
      await signIn(email.trim() || 'new@vesha.app', name || 'New User');
      await updateProfile({
        heightCm: height ? Number(height) : undefined,
      });
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
          <Text variant="title">Create your closet</Text>
          <Text variant="body" color={colors.muted}>
            A quick profile helps personalize your wardrobe later.
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
            placeholder="Create a password"
          />
          <Input
            label="Height (cm) — optional"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
            placeholder="168"
          />
          <Button
            label={loading ? 'Creating…' : 'Get started'}
            onPress={onRegister}
            disabled={loading}
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
