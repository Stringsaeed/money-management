import { Alert, View } from "react-native";

import { NativeHost, NativeTertiaryButton } from "@/components/native-ui";
import { Text } from "@/components/ui/text";
import { useTransferOwnership } from "@/hooks/use-households";

export type HouseholdMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: "owner" | "member";
};

/** Lists household members; owners can hand ownership to another member. */
export function HouseholdMembers({
  members,
  currentUserId,
  isOwner,
  householdId,
}: {
  members: readonly HouseholdMember[];
  currentUserId: string;
  isOwner: boolean;
  householdId: string;
}) {
  const transferOwnership = useTransferOwnership();

  function handleTransfer(member: HouseholdMember) {
    if (member.role === "owner") return;
    Alert.alert(
      "Transfer ownership",
      `${member.userName} will become the owner and you'll become a member. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transfer",
          style: "destructive",
          onPress: () => {
            transferOwnership.mutate({ householdId, userId: member.userId });
          },
        },
      ],
    );
  }

  return (
    <View>
      {members.map((member) => (
        <View
          key={member.userId}
          className="flex-row items-center gap-3 border-b border-ledger-outline px-4 py-3 last:border-b-0"
        >
          <View className="flex-1">
            <Text className="font-body-medium text-base text-ink">
              {member.userName}
              {member.userId === currentUserId ? " (you)" : ""}
            </Text>
            <Text className="font-body-normal text-xs text-ink/40">{member.userEmail}</Text>
          </View>
          {member.role === "owner" ? (
            <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/40">
              👑 Owner
            </Text>
          ) : isOwner ? (
            <NativeHost fillWidth={false}>
              <NativeTertiaryButton
                label="Make owner"
                onPress={() => handleTransfer(member)}
                disabled={transferOwnership.isPending}
                testID={`make-owner-${member.userId}`}
              />
            </NativeHost>
          ) : null}
        </View>
      ))}
      {transferOwnership.isError ? (
        <Text className="text-destructive px-4 pb-3 text-xs">
          Couldn’t transfer ownership. Try again in a moment.
        </Text>
      ) : null}
    </View>
  );
}
