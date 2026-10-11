import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Header, layout } from "@/ui/trove";

/** The compact pushed-screen header every setup step shares. */
export function SetupHeader() {
  return (
    <View style={styles.header}>
      <Header variant="compact" title="Set up budget" onBack={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.screenGutter },
});
