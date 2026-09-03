import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";

interface AuthScreenShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-surface"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 pb-safe pt-safe"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-2">
          <Text className="font-heading-medium italic text-4xl tracking-tight text-ink">
            {title}
          </Text>
          <Text className="text-muted-foreground text-base">{subtitle}</Text>
        </View>
        <View className="mt-8 gap-3">{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
