import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { Button, Card, Icon, space, Text } from "@/ui/trove";

/** Home entry point to the Budget tab. */
export function HomeBudgetCard() {
  return (
    <View style={styles.section}>
      <Text variant="titleSm">Budget</Text>
      <Card style={styles.card}>
        <Icon name="insights" size={24} />
        <Text variant="titleSm">Plan your month</Text>
        <Text variant="bodySm">See what is safe to spend until your next payday.</Text>
        <Button
          fullWidth
          label="Open budget"
          onPress={() => router.navigate("/(tabs)/envelopes")}
        />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[3] },
  card: { gap: space[2] },
});
