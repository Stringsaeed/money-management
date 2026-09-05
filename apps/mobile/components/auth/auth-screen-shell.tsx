import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";

interface AuthScreenShellProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: ReactNode;
}

export function AuthScreenShell({ title, subtitle, children }: AuthScreenShellProps) {
  return (
    <ScrollView
      className="bg-surface"
      contentContainerClassName="grow justify-center px-6 bg-surface"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="gap-2">
        <Text className="font-heading-medium italic text-4xl tracking-tight text-ink">{title}</Text>
        <Text className="text-muted-foreground text-base">{subtitle}</Text>
      </View>
      <View className="mt-8 gap-3">{children}</View>
    </ScrollView>
  );
}
