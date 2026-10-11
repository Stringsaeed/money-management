import { View } from "react-native";

import { Banner } from "@/ui/trove";

/** The numbers could not be loaded or refreshed: say so and offer Retry, never a 0 or an old value. */
export function BudgetHomeError({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <View accessibilityRole="alert">
      <Banner
        actionLabel="Retry"
        message="Your numbers are hidden until we can load them again."
        onAction={onRetry}
        title="Couldn't calculate"
        tone="negative"
      />
    </View>
  );
}
