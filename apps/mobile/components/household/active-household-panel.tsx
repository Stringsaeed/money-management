import { Alert, View } from "react-native";

import { EnableSyncCard } from "@/components/household/enable-sync-card";
import { HouseholdMembers, type HouseholdMember } from "@/components/household/household-members";
import { SyncStatusCard } from "@/components/household/sync-status-card";
import { NativeDestructiveButton, NativeHost, NativePrimaryButton } from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { SectionHeader } from "@/components/settings/section-header";
import { Text } from "@/components/ui/text";
import { useDeleteHousehold, useGenerateInvite, useLeaveHousehold } from "@/hooks/use-households";
import { formatInviteExpiry } from "@/utils/invite-code";

interface ActiveHouseholdPanelProps {
  readonly householdId: string;
  readonly name: string;
  readonly currentUserId: string;
  readonly isOwner: boolean;
  readonly needsSync: boolean;
  readonly members: readonly HouseholdMember[];
}

export function ActiveHouseholdPanel({
  householdId,
  name,
  currentUserId,
  isOwner,
  needsSync,
  members,
}: ActiveHouseholdPanelProps) {
  const generateInvite = useGenerateInvite();
  const leaveHousehold = useLeaveHousehold();
  const deleteHousehold = useDeleteHousehold();

  return (
    <>
      {needsSync ? (
        <Card>
          <EnableSyncCard activeHouseholdId={householdId} />
        </Card>
      ) : (
        <SyncStatusCard />
      )}
      <Card>
        <View className="flex-row items-center justify-between p-4">
          <View className="gap-1">
            <Text className="font-body-semibold text-xs uppercase text-ink/40">
              Active Household
            </Text>
            <Text className="font-heading-normal text-xl italic text-ink">{name}</Text>
          </View>
          <NativeHost fillWidth={false}>
            <NativePrimaryButton
              label="Invite 🎟️"
              onPress={() => invite(householdId, generateInvite)}
              testID="invite-household"
            />
          </NativeHost>
        </View>
      </Card>
      <Card>
        <SectionHeader title="Members 👥" variant="card" />
        <HouseholdMembers
          householdId={householdId}
          isOwner={isOwner}
          currentUserId={currentUserId}
          members={members}
        />
      </Card>
      <Card>
        <View className="gap-2 p-4">
          <Text className="font-body-semibold text-xs uppercase text-destructive">Danger Zone</Text>
          {isOwner ? (
            <NativeHost>
              <NativeDestructiveButton
                label="Delete household"
                onPress={() => confirmDelete(householdId, deleteHousehold.mutate)}
                testID="delete-household"
              />
            </NativeHost>
          ) : (
            <NativeHost>
              <NativeDestructiveButton
                label="Leave household"
                onPress={() => confirmLeave(householdId, leaveHousehold.mutate)}
                testID="leave-household"
              />
            </NativeHost>
          )}
        </View>
      </Card>
    </>
  );
}

function invite(householdId: string, generateInvite: ReturnType<typeof useGenerateInvite>) {
  generateInvite.mutate(
    { householdId },
    {
      onSuccess: (created) => {
        Alert.alert(
          "Invite code 🎟️",
          `Share this code with family:\n\n${created.code}\n\n${formatInviteExpiry(created.expiresAt)} · single-use`,
        );
      },
      onError: () => {
        Alert.alert("Couldn't create invite", "Check your connection and try again.");
      },
    },
  );
}

function confirmLeave(householdId: string, leave: (householdId: string) => void) {
  Alert.alert("Leave household?", "You'll lose access until you're invited again.", [
    { text: "Cancel", style: "cancel" },
    { text: "Leave", style: "destructive", onPress: () => leave(householdId) },
  ]);
}

function confirmDelete(householdId: string, remove: (householdId: string) => void) {
  Alert.alert(
    "Delete household?",
    "All memberships and invites are removed for everyone. This cannot be undone.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove(householdId) },
    ],
  );
}
