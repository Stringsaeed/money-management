import { Alert } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";

import { AccountDeleteAction } from "@/components/settings/account-delete-action";
import { AccountRow } from "@/components/settings/account-row";
import { accountDeletionMessage } from "@/components/account/account-deletion-message";
import type { AccountDeletionPreview } from "@/modules/account-recurring-coordinator";

import type { AccountRowProps } from "./types";

interface SwipeableAccountRowProps extends AccountRowProps {
  onDelete: (id: string) => Promise<unknown>;
  onPreviewDelete: (id: string) => Promise<AccountDeletionPreview>;
}

export function SwipeableAccountRow({
  account,
  onDelete,
  onPreviewDelete,
  onPress,
}: SwipeableAccountRowProps) {
  async function confirmDelete(swipeable: SwipeableMethods) {
    try {
      const preview = await onPreviewDelete(account.id);
      Alert.alert("Delete Account?", accountDeletionMessage(account.name, preview), [
        {
          text: "Cancel",
          style: "cancel",
          onPress: swipeable.close,
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            swipeable.close();
            try {
              await onDelete(account.id);
            } catch {
              Alert.alert(
                "Couldn't Delete Account",
                "The account was not deleted. Please try again.",
              );
            }
          },
        },
      ]);
    } catch {
      swipeable.close();
      Alert.alert(
        "Couldn't Check Recurring Rules",
        "The account was not deleted. Please try again.",
      );
    }
  }

  function renderRightActions(
    _progress: SharedValue<number>,
    _translation: SharedValue<number>,
    swipeable: SwipeableMethods,
  ) {
    return (
      <AccountDeleteAction
        accountName={account.name}
        onPress={() => void confirmDelete(swipeable)}
      />
    );
  }

  return (
    <Swipeable
      enableTrackpadTwoFingerGesture
      overshootFriction={8}
      renderRightActions={renderRightActions}
      rightThreshold={48}
    >
      <AccountRow account={account} onPress={onPress} />
    </Swipeable>
  );
}
