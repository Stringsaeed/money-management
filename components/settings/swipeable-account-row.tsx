import { Alert } from "react-native";
import Swipeable, { type SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";

import { AccountDeleteAction } from "@/components/settings/account-delete-action";
import { AccountRow } from "@/components/settings/account-row";

import type { AccountRowProps } from "./types";

interface SwipeableAccountRowProps extends AccountRowProps {
  onDelete: (id: string) => Promise<void>;
}

export function SwipeableAccountRow({ account, onDelete }: SwipeableAccountRowProps) {
  function confirmDelete(swipeable: SwipeableMethods) {
    Alert.alert(
      "Delete Account?",
      `This will permanently delete ${account.name} and all its transactions. This cannot be undone.`,
      [
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
      ],
    );
  }

  function renderRightActions(
    _progress: SharedValue<number>,
    _translation: SharedValue<number>,
    swipeable: SwipeableMethods,
  ) {
    return (
      <AccountDeleteAction accountName={account.name} onPress={() => confirmDelete(swipeable)} />
    );
  }

  return (
    <Swipeable
      enableTrackpadTwoFingerGesture
      overshootFriction={8}
      renderRightActions={renderRightActions}
      rightThreshold={48}
    >
      <AccountRow account={account} />
    </Swipeable>
  );
}
