import { Switch, View } from "react-native";

import { Text } from "@/components/ui/text";

interface AccountPrivacyToggleProps {
  isPrivate: boolean;
  isPending: boolean;
  onChange: (isPrivate: boolean) => void;
}

/** Owner-only control for a server-authoritative account's shared visibility. */
export const AccountPrivacyToggle = ({
  isPrivate,
  isPending,
  onChange,
}: AccountPrivacyToggleProps) => {
  return (
    <View className="flex-row items-center justify-between gap-4 rounded-xl border border-ledger-outline bg-surface-container px-4 py-3">
      <View className="flex-1 gap-0.5">
        <Text className="font-body-medium text-sm text-ink">Private account</Text>
        <Text className="font-body-normal text-xs text-ink/50">
          Hide this account and its activity from other household members.
        </Text>
      </View>
      <Switch
        aria-label="Private account"
        disabled={isPending}
        onValueChange={onChange}
        value={isPrivate}
      />
    </View>
  );
};
