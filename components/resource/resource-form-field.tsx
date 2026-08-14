import type { ReactNode } from "react";
import { View } from "react-native";

import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";

export const resourceInputClassName =
  "rounded-2xl border border-ledger-outline bg-surface px-4 py-3 text-base leading-5 text-ink";

export { inputTextStyle };

interface ResourceFormFieldProps {
  children: ReactNode;
  error?: unknown;
  label: string;
}

export function ResourceFormField({ children, error, label }: ResourceFormFieldProps) {
  return (
    <View className="gap-2">
      <Text className="font-body-medium text-sm text-ink/60">{label}</Text>
      {children}
      {error ? (
        <Text className="font-body-medium text-xs text-destructive">{String(error)}</Text>
      ) : null}
    </View>
  );
}
