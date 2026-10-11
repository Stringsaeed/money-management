import { useState } from "react";
import { StyleSheet } from "react-native";

import { Button, Card, space, Text, TextField } from "@/ui/trove";

interface HouseholdInviteCardProps {
  readonly busy: boolean;
  readonly onInvite: (email: string) => Promise<void>;
}

export function HouseholdInviteCard({ busy, onInvite }: HouseholdInviteCardProps) {
  const [email, setEmail] = useState("");
  return (
    <Card style={styles.card}>
      <Text variant="titleSm">Invite someone</Text>
      <Text tone="secondary" variant="bodyMd">
        They will receive a WorkOS invitation. After accepting the email, they should sign in to
        Trove Next.
      </Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        fullWidth
        label="Send invitation"
        loading={busy}
        onPress={() => {
          if (!email.trim()) return;
          void onInvite(email.trim()).then(() => setEmail(""));
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({ card: { gap: space[3] } });
