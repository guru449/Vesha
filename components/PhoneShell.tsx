import type { ReactNode } from 'react';
import { View } from 'react-native';

/** Native: no phone chrome — the device is the frame. */
export function PhoneShell({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
