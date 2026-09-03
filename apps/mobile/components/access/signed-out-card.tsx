import { View } from "react-native";

import { Card } from "@/components/settings/card";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

export function SignedOutCard({ onSignIn }: { readonly onSignIn: () => void }) {
  return (
    <Card>
      <View className="gap-3 px-4 py-6">
        <Text className="text-4xl">🏠</Text>
        <Text className="font-heading-normal text-xl italic text-ink">Profile & household</Text>
        <Text className="font-body-normal text-sm text-ink/40">
          Sign in to create a household, invite family members, and plan money together. Your ledger
          always stays on this device.
        </Text>
        <Button size="lg" onPress={onSignIn}>
          <Text className="font-body-semibold text-white">Sign in or create profile</Text>
        </Button>
      </View>
    </Card>
  );
}
