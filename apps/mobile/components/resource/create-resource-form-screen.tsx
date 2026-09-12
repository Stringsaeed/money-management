import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

interface CreateResourceFormScreenProps {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Expo Router create-resource screens (account/new, category/new).
 *
 * Keep create-resource-submit inside this ScrollView (#262). Sticky siblings
 * missed device taps. Pair with a currency picker that mounts no @expo/ui Host
 * while closed — #262 still failed coord taps at the submit AX frame.
 */
export function CreateResourceFormScreen({ children, footer }: CreateResourceFormScreenProps) {
  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 px-5 py-4 pb-safe"
        keyboardShouldPersistTaps="always"
        testID="create-resource-form-scroll"
      >
        {children}
        <View collapsable={false} testID="create-resource-form-footer">
          {footer}
        </View>
      </ScrollView>
    </View>
  );
}
