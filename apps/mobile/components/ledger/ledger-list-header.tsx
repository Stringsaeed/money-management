import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterBar } from "@/components/home/filter-bar";
import { spacing } from "@/lib/design-tokens";

export function LedgerListHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + spacing[20] }}>
      <FilterBar />
    </View>
  );
}
