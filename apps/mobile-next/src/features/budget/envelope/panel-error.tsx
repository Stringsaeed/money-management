import { Text } from "@/ui/trove";

/** Failure copy under a panel's action. Announced so it is not colour only. */
export function PanelError({ message }: { readonly message: string | undefined }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" tone="negative" variant="labelMd">
      {message}
    </Text>
  );
}
