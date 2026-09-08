import { View } from "react-native";

import { Card } from "@/components/settings/card";
import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
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
        <NativeHost>
          <NativePrimaryButton
            label="Sign in again"
            onPress={onReauthenticate}
            testID="profile-reauthenticate"
          />
        </NativeHost>
        <NativeHost>
          <NativeSecondaryButton
            label="Forget this profile"
            onPress={onSignOut}
            testID="profile-forget"
          />
        </NativeHost>
      </View>
    </Card>
  );
}
