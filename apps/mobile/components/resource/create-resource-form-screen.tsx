import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

interface CreateResourceFormScreenProps {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Expo Router create-resource screens (account/new, category/new): keep the
 * footer outside a flex-1 ScrollView and above the home indicator. Modal
 * stack headers already inset the top — avoid safe-top/safe-bottom on the
 * avoiding view (agent-device #258: footer reported hittable but taps missed).
 */
export function CreateResourceFormScreen({ children, footer }: CreateResourceFormScreenProps) {
  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-4"
          contentInsetAdjustmentBehavior="automatic"
          keyboardShouldPersistTaps="handled"
          testID="create-resource-form-scroll"
        >
          {children}
        </ScrollView>
        <View
          className="z-10 bg-background pb-safe"
          collapsable={false}
          testID="create-resource-form-footer"
        >
          {footer}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
