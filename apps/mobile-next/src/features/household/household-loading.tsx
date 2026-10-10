import { StyleSheet, View } from "react-native";

import { radius, Skeleton, space } from "@/ui/trove";

export function HouseholdLoading() {
  return (
    <View
      accessible
      accessibilityLabel="Loading household"
      accessibilityState={{ busy: true }}
      style={styles.loading}
    >
      <Skeleton height={space[10]} width="50%" />
      <Skeleton borderRadius={radius.lg} height={space[16] + space[10]} />
      <Skeleton borderRadius={radius.lg} height={space[16] + space[10]} />
    </View>
  );
}

const styles = StyleSheet.create({ loading: { gap: space[4], paddingTop: space[3] } });
