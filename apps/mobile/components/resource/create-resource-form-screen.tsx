import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

interface CreateResourceFormScreenProps {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Expo Router create-resource screens (account/new, category/new).
 *
 * Device certs #258/#260/#261 kept create-resource-submit as a sticky footer
 * outside the form ScrollView. In-scroll Pressables (e.g. the Savings account
 * type chip) received taps; the sticky submit reported hittable=true but
 * missed. Put the footer in the same ScrollView so submit shares that hit path.
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
