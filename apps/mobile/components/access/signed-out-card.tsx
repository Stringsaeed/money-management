import { View } from "react-native";

import { Card } from "@/components/settings/card";
import { NativeHost, NativePrimaryButton } from "@/components/native-ui";
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
        <NativeHost>
          <NativePrimaryButton
            label="Sign in or create profile"
            onPress={onSignIn}
            testID="profile-sign-in"
          />
        </NativeHost>
      </View>
    </Card>
  );
}
