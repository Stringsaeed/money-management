import { router } from "expo-router";
import { Alert, ScrollView, View } from "react-native";

import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { EnableSyncCard } from "@/components/household/enable-sync-card";
import { HouseholdMembers } from "@/components/household/household-members";
import { JoinHouseholdForm } from "@/components/household/join-household-form";
import { Card } from "@/components/settings/card";
import { SectionHeader } from "@/components/settings/section-header";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useActiveHousehold,
  useDeleteHousehold,
  useGenerateInvite,
  useHouseholdDetail,
  useLeaveHousehold,
} from "@/hooks/use-households";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { authClient } from "@/lib/auth-client";
import { formatInviteExpiry } from "@/utils/invite-code";

function SignedOutCard() {
  return (
    <Card>
      <View className="gap-3 px-4 py-6">
        <Text className="text-4xl">🏠</Text>
        <Text className="font-heading-normal text-xl italic text-ink">Share with family</Text>
        <Text className="font-body-normal text-sm text-ink/40">
          Sign in to create a household, invite family members, and plan money together. Your ledger
          always stays on this device.
        </Text>
        <Button size="lg" onPress={() => router.push("/(auth)/sign-in")}>
          <Text className="font-body-semibold text-white">Sign in</Text>
        </Button>
      </View>
    </Card>
  );
}

export default function HouseholdScreen() {
  const { data: session, isPending } = authClient.useSession();
  const { activeHousehold } = useActiveHousehold();
  const { data: detail, isLoading: detailLoading } = useHouseholdDetail(
    activeHousehold?.householdId ?? null,
  );
  const { data: migratedHouseholdId } = useMigratedHouseholdId();
  const generateInvite = useGenerateInvite();
  const leaveHousehold = useLeaveHousehold();
  const deleteHousehold = useDeleteHousehold();

  const user = session?.user ?? null;
  const isOwner = detail?.members.some((m) => m.userId === user?.id && m.role === "owner") ?? false;
  const needsSync = migratedHouseholdId !== (activeHousehold?.householdId ?? null);

  function handleInvite() {
    if (!activeHousehold) return;
    generateInvite.mutate(
      { householdId: activeHousehold.householdId },
      {
        onSuccess: (invite) => {
          Alert.alert(
            "Invite code 🎟️",
            `Share this code with family:\n\n${invite.code}\n\n${formatInviteExpiry(invite.expiresAt)} · single-use`,
          );
        },
        onError: () => {
          Alert.alert("Couldn't create invite", "Check your connection and try again.");
        },
      },
    );
  }

  function confirmLeave() {
    if (!activeHousehold) return;
    Alert.alert("Leave household?", "You'll lose access until you're invited again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: () => leaveHousehold.mutate(activeHousehold.householdId),
      },
    ]);
  }

  function confirmDelete() {
    if (!activeHousehold) return;
    Alert.alert(
      "Delete household?",
      "All memberships and invites are removed for everyone. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteHousehold.mutate(activeHousehold.householdId),
        },
      ],
    );
  }

  if (isPending) {
    return (
      <ScrollView contentContainerClassName="px-4 pb-safe pt-safe">
        <SectionHeader title="Household 🏠" />
        <Text className="text-muted-foreground px-1 py-6 text-sm">Loading…</Text>
      </ScrollView>
    );
  }

  if (!user) {
    return (
      <ScrollView contentContainerClassName="px-4 pb-safe pt-safe">
        <SectionHeader title="Household 🏠" />
        <SignedOutCard />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-2 px-4 pb-safe pt-safe">
      <SectionHeader title="Household 🏠" />

      {needsSync ? (
        <Card>
          <EnableSyncCard activeHouseholdId={activeHousehold?.householdId ?? null} />
        </Card>
      ) : null}

      {activeHousehold && detail ? (
        <>
          <Card>
            <View className="gap-1 px-4 pt-4 pb-2">
              <Text className="font-heading-medium italic text-2xl text-ink">{detail.name}</Text>
              <Text className="font-body-normal text-xs text-ink/40">
                {detail.members.length} {detail.members.length === 1 ? "member" : "members"} ·
                you’re {isOwner ? "the owner 👑" : "a member"}
              </Text>
            </View>
            <HouseholdMembers
              members={detail.members}
              currentUserId={user.id}
              isOwner={isOwner}
              householdId={detail.householdId}
            />
          </Card>

          {isOwner ? (
            <>
              <SectionHeader title="Invites 🎟️" />
              <Card>
                <View className="gap-2 px-4 py-4">
                  <Button
                    variant="secondary"
                    onPress={handleInvite}
                    disabled={generateInvite.isPending}
                  >
                    <Text className="font-body-semibold text-white">
                      {generateInvite.isPending ? "Creating…" : "Create invite code"}
                    </Text>
                  </Button>
                  <Text className="font-body-normal text-xs text-ink/40">
                    Codes expire after 7 days and work once.
                  </Text>
                </View>
              </Card>

              <SectionHeader title="Danger Zone ⚠️" />
              <Card>
                <View className="flex-row gap-2 px-4 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onPress={confirmLeave}
                    disabled={isOwner}
                  >
                    <Text className="text-ink/60 font-body-semibold">Leave</Text>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onPress={confirmDelete}
                  >
                    <Text className="font-body-semibold text-white">Delete household</Text>
                  </Button>
                </View>
                <Text className="font-body-normal text-xs text-ink/40 px-4 pb-4">
                  Owners can’t leave — transfer ownership to a member first.
                </Text>
              </Card>
            </>
          ) : (
            <Card>
              <Button variant="destructive" size="sm" className="m-4" onPress={confirmLeave}>
                <Text className="font-body-semibold text-white">Leave household</Text>
              </Button>
            </Card>
          )}
        </>
      ) : (
        <>
          <SectionHeader title="Get started ✨" />
          <Card>
            <CreateHouseholdForm />
          </Card>
          <SectionHeader title="Have a code? 🎟️" />
          <Card>
            <JoinHouseholdForm />
          </Card>
        </>
      )}

      {detailLoading ? (
        <Text className="text-muted-foreground px-1 py-2 text-xs">Refreshing…</Text>
      ) : null}
    </ScrollView>
  );
}
