import { View } from "react-native";

import { Card } from "@/components/settings/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

interface SessionRevokedCardProps {
  readonly email: string;
  readonly onReauthenticate: () => void;
  readonly onSignOut: () => void;
}

export function SessionRevokedCard({
  email,
  onReauthenticate,
  onSignOut,
}: SessionRevokedCardProps) {
  return (
    <Card>
      <View className="gap-3 p-4">
        <Text className="font-body-semibold text-destructive">Signed out remotely</Text>
        <Text className="text-xs text-ink/70">
          {email} is no longer signed in here. Your local ledger is fully usable.
        </Text>
        <Button size="sm" onPress={onReauthenticate}>
          <Text className="font-body-semibold text-white">Sign in again</Text>
        </Button>
        <Button variant="outline" size="sm" onPress={onSignOut}>
          <Text className="font-body-semibold text-destructive">Forget this profile</Text>
        </Button>
      </View>
    </Card>
  );
}
