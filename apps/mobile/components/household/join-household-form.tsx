import { View } from "react-native";

import { Text } from "@/components/ui/text";

/**
 * Custom Invite Codes are retired. Joining happens through WorkOS invitation
 * emails and AuthKit; this card explains that so Settings does not look broken.
 */
export function JoinHouseholdForm() {
  return (
    <View className="gap-2 px-4 py-4">
      <Text className="font-body-normal text-xs text-ink/50">
        Ask an admin to invite you from Manage members. Open the invitation link, sign in with an
        email code, and your Personal ledger stays private.
      </Text>
    </View>
  );
}
