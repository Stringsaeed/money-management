import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Header, layout } from "@/ui/trove";

/** The compact pushed-screen header every setup step (and the payday steps) shares. */
export function SetupHeader({ title = "Set up budget" }: { readonly title?: string }) {
  return (
    <View style={styles.header}>
      <Header variant="compact" title={title} onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenGutter },
});
