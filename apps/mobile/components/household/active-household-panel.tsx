import { Alert, View } from "react-native";

import { EnableSyncCard } from "@/components/household/enable-sync-card";
import { HouseholdMembers, type HouseholdMember } from "@/components/household/household-members";
import { SyncStatusCard } from "@/components/household/sync-status-card";
import {
  NativeDestructiveButton,
  NativeHost,
  NativePrimaryButton,
  NativeSecondaryButton,
} from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { SectionHeader } from "@/components/settings/section-header";
import { Text } from "@/components/ui/text";
import { useDeleteHousehold, useLeaveHousehold, useOpenMemberWidget } from "@/hooks/use-households";

interface ActiveHouseholdPanelProps {
  readonly householdId: string;
  readonly name: string;
  readonly currentUserId: string;
  readonly isAdmin: boolean;
  readonly needsSync: boolean;
  readonly members: readonly HouseholdMember[];
  readonly adminless?: boolean;
}

export function ActiveHouseholdPanel({
  householdId,
  name,
  currentUserId,
  isAdmin,
  needsSync,
  members,
  adminless = false,
}: ActiveHouseholdPanelProps) {
  const openWidget = useOpenMemberWidget();
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
          {isAdmin ? (
            <NativeHost fillWidth={false}>
              <NativePrimaryButton
                label={openWidget.isPending ? "Opening…" : "Manage 👥"}
                onPress={() => openMembers(householdId, openWidget)}
                disabled={openWidget.isPending}
                testID="manage-household-members"
              />
            </NativeHost>
          ) : null}
        </View>
        {adminless ? (
          <Text className="px-4 pb-4 text-xs text-terracotta">
            This Household has no admin. Ask WorkOS support or recreate administration carefully —
            Trove cannot invent a last-admin invariant from webhooks.
          </Text>
        ) : null}
      </Card>
      <Card>
        <SectionHeader title="Members 👥" variant="card" />
        <HouseholdMembers currentUserId={currentUserId} members={members} />
        {!isAdmin ? (
          <Text className="px-4 pb-4 text-xs text-ink/50">
            Invitations and role changes are managed by a Household admin.
          </Text>
        ) : (
          <Text className="px-4 pb-4 text-xs text-ink/50">
            Invite people and change roles in Manage — WorkOS hosts that screen.
          </Text>
        )}
      </Card>
      <Card>
        <View className="gap-2 p-4">
          <Text className="font-body-semibold text-xs uppercase text-destructive">Danger Zone</Text>
          {isAdmin ? (
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
          {isAdmin ? (
            <NativeHost>
              <NativeSecondaryButton
                label="Leave household"
                onPress={() => confirmLeave(householdId, leaveHousehold.mutate)}
                testID="leave-household"
              />
            </NativeHost>
          ) : null}
        </View>
      </Card>
    </>
  );
}

function openMembers(householdId: string, openWidget: ReturnType<typeof useOpenMemberWidget>) {
  openWidget.mutate(householdId, {
    onError: () => {
      Alert.alert("Couldn't open members", "Check your connection and try again.");
    },
  });
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
    "Deletes the WorkOS organization and every shared Account, Category, and Transaction. Personal ledgers are untouched.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => remove(householdId) },
    ],
  );
}
