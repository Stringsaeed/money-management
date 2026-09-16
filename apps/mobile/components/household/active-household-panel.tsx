import { Alert, Platform, StyleSheet, View } from "react-native";

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
import { colors, spacing, typography } from "@/lib/design-tokens";

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
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>Active Household</Text>
            <Text style={styles.householdName}>{name}</Text>
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
          <Text style={styles.adminlessWarning}>
            This Household has no admin. Ask WorkOS support or recreate administration carefully —
            Trove cannot invent a last-admin invariant from webhooks.
          </Text>
        ) : null}
      </Card>
      <Card>
        <SectionHeader title="Members 👥" variant="card" />
        <HouseholdMembers currentUserId={currentUserId} members={members} />
        {!isAdmin ? (
          <Text style={styles.memberHint}>
            Invitations and role changes are managed by a Household admin.
          </Text>
        ) : (
          <Text style={styles.memberHint}>
            Invite people and change roles in Manage — WorkOS hosts that screen.
          </Text>
        )}
      </Card>
      <Card>
        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>Danger Zone</Text>
          {isAdmin ? (
            <NativeHost>
              <NativeDestructiveButton
                label="Delete household"
                onPress={() => confirmDelete(householdId, name, deleteHousehold.mutate)}
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

function confirmDelete(
  householdId: string,
  name: string,
  remove: (input: { householdId: string; confirmName: string }) => void,
) {
  const run = (confirmName: string) => remove({ householdId, confirmName });

  // Alert.prompt is iOS-only; collect the typed Household name there.
  if (Platform.OS === "ios") {
    Alert.prompt(
      "Delete household?",
      `Type "${name}" to confirm. Deletes the WorkOS organization and every shared Account, Category, and Transaction. Personal ledgers are untouched.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: (value?: string) => {
            if (value != null && value.length > 0) {
              run(value);
            }
          },
        },
      ],
      "plain-text",
    );
    return;
  }

  Alert.alert(
    "Delete household?",
    `This permanently deletes "${name}" — the WorkOS organization and every shared Account, Category, and Transaction. Personal ledgers are untouched.`,
    [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => run(name) },
    ],
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  headerContent: {
    gap: spacing[1],
  },
  headerLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    color: colors.ink,
    opacity: 0.4,
  },
  householdName: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  adminlessWarning: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    fontSize: typography.textXs,
    color: colors.terracotta,
  },
  memberHint: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  dangerZone: {
    gap: spacing[2],
    padding: spacing[4],
  },
  dangerLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    color: colors.destructive,
  },
});
