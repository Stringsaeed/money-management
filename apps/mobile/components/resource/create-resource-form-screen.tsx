import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

interface CreateResourceFormScreenProps {
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Expo Router create-resource screens (account/new, category/new).
 *
 * Keep the submit footer outside KeyboardAvoidingView. agent-device #260 kept
 * the footer as a KAV sibling of ScrollView and reported create-resource-submit
 * hittable=false (rect center ~201,802) until an in-scroll sibling was pressed.
 * KAV only wraps the scroll body; the footer is a flex sibling with pb-safe so
 * home-indicator inset does not shift the Pressable hit target.
 */
export function CreateResourceFormScreen({ children, footer }: CreateResourceFormScreenProps) {
  return (
    <View className="flex-1 bg-background" pointerEvents="box-none">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        pointerEvents="box-none"
        testID="create-resource-form-kav"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 px-5 py-4"
          keyboardShouldPersistTaps="handled"
          testID="create-resource-form-scroll"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        className="z-10 bg-background pb-safe"
        collapsable={false}
        pointerEvents="box-none"
        testID="create-resource-form-footer"
      >
        {footer}
      </View>
    </View>
  );
}
