import { useState } from "react";
import { StyleSheet } from "react-native";

import { Button, Card, space, Text, TextField } from "@/ui/trove";

interface HouseholdCreateCardProps {
  readonly busy: boolean;
  readonly onCreate: (name: string) => Promise<void>;
}

export function HouseholdCreateCard({ busy, onCreate }: HouseholdCreateCardProps) {
  const [name, setName] = useState("");
  return (
    <Card style={styles.card}>
      <Text variant="titleSm">Create a household</Text>
      <Text tone="secondary" variant="bodyMd">
        You can create one household. You can leave it after another member becomes an admin.
      </Text>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="e.g. Home" />
      <Button
        fullWidth
        label="Create household"
        loading={busy}
        onPress={() => {
          if (!name.trim()) return;
          void onCreate(name.trim()).then(() => setName(""));
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: space[3] } });
