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
  useSetActiveHousehold,
} from "@/hooks/use-households";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { authClient } from "@/lib/auth-client";
import { formatInviteExpiry } from "@/utils/invite-code";

function SignedOutCard() {
  return (
    <Card>
      <View className="gap-3 px-4 py-6">
        <Text className="text-4xl">🏠</Text>
        <Text className="font-heading-normal text-xl italic text-ink">Profile & household</Text>
        <Text className="font-body-normal text-sm text-ink/40">
          Sign in to create a household, invite family members, and plan money together. Your ledger
          always stays on this device.
        </Text>
        <Button size="lg" onPress={() => router.push("/(auth)/sign-in")}>
          <Text className="font-body-semibold text-white">Sign in or create profile</Text>
        </Button>
      </View>
    </Card>
  );
}

export default function HouseholdScreen() {
  const { data: session, isPending, error: sessionError } = authClient.useSession();
  const { activeHousehold, households = [] } = useActiveHousehold();
  const setActiveHousehold = useSetActiveHousehold();
  const { data: detail } = useHouseholdDetail(activeHousehold?.householdId ?? null);
  const { data: migratedHouseholdId } = useMigratedHouseholdId();
  const generateInvite = useGenerateInvite();
  const leaveHousehold = useLeaveHousehold();
  const deleteHousehold = useDeleteHousehold();

  const user = session?.user ?? null;
  const isOwner = detail?.members.some((m) => m.userId === user?.id && m.role === "owner") ?? false;
  const needsSync = migratedHouseholdId !== (activeHousehold?.householdId ?? null);

  async function handleSignOut() {
    try {
      await authClient.signOut();
      router.replace("/");
    } catch {
      Alert.alert("Sign out failed", "Please check your connection and try again.");
    }
  }

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
        <SectionHeader title="Profile & household 👤" />
        <Text className="text-muted-foreground px-1 py-6 text-sm">Loading…</Text>
      </ScrollView>
    );
  }

  if (!user || sessionError) {
    return (
      <ScrollView contentContainerClassName="px-4 pb-safe pt-safe">
        <SectionHeader title="Profile & household 👤" />
        {sessionError ? (
          <View className="mb-3 bg-destructive/10 rounded-lg p-4 gap-2">
            <Text className="font-body-semibold text-destructive">Session expired or revoked</Text>
            <Text className="text-xs text-ink/70">
              Your local ledger is fully usable, but remote household features are paused.
            </Text>
            <Button size="sm" onPress={() => router.push("/(auth)/sign-in")}>
              <Text className="font-body-semibold text-white">Sign in again</Text>
            </Button>
          </View>
        ) : null}
        <SignedOutCard />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerClassName="gap-2 px-4 pb-safe pt-safe">
      <SectionHeader title="Profile & household 👤" />

      {/* Profile Card */}
      <Card>
        <View className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="font-heading-normal text-lg italic text-ink">{user.name}</Text>
              <Text className="text-xs text-ink/50">{user.email}</Text>
            </View>
            <Button variant="outline" size="sm" onPress={handleSignOut}>
              <Text className="font-body-semibold text-destructive">Sign out</Text>
            </Button>
          </View>
        </View>
      </Card>

      {/* Household Switcher if multiple memberships */}
      {households.length > 1 ? (
        <Card>
          <View className="gap-3 p-4">
            <Text className="font-body-semibold text-xs uppercase text-ink/40">
              Active Household
            </Text>
            <View className="gap-2">
              {households.map((h) => {
                const isSelected = h.householdId === activeHousehold?.householdId;
                return (
                  <Button
                    key={h.householdId}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onPress={() => setActiveHousehold.mutate(h.householdId)}
                  >
                    <Text
                      className={
                        isSelected ? "font-body-semibold text-white" : "font-body-medium text-ink"
                      }
                    >
                      {h.name} {isSelected ? "✓" : ""}
                    </Text>
                  </Button>
                );
              })}
            </View>
          </View>
        </Card>
      ) : null}

      {!activeHousehold ? (
        <>
          <Card>
            <View className="p-4">
              <Text className="font-body-semibold text-sm mb-3">Create a Household</Text>
              <CreateHouseholdForm />
            </View>
          </Card>
          <Card>
            <View className="p-4">
              <Text className="font-body-semibold text-sm mb-3">Join with Invite Code</Text>
              <JoinHouseholdForm />
            </View>
          </Card>
        </>
      ) : (
        <>
          {needsSync ? (
            <Card>
              <EnableSyncCard activeHouseholdId={activeHousehold?.householdId ?? null} />
            </Card>
          ) : null}

          <Card>
            <View className="flex-row items-center justify-between p-4">
              <View className="gap-1">
                <Text className="font-body-semibold text-xs uppercase text-ink/40">
                  Active Household
                </Text>
                <Text className="font-heading-normal text-xl italic text-ink">
                  {activeHousehold.name}
                </Text>
              </View>
              <Button size="sm" onPress={handleInvite}>
                <Text className="font-body-semibold text-white">Invite 🎟️</Text>
              </Button>
            </View>
          </Card>

          <Card>
            <SectionHeader title="Members 👥" />
            <HouseholdMembers
              householdId={activeHousehold.householdId}
              isOwner={isOwner}
              currentUserId={user.id}
              members={detail?.members ?? []}
            />
          </Card>

          <Card>
            <View className="p-4 gap-2">
              <Text className="font-body-semibold text-xs uppercase text-destructive">
                Danger Zone
              </Text>
              {isOwner ? (
                <Button variant="destructive" size="sm" onPress={confirmDelete}>
                  <Text className="font-body-semibold text-white">Delete household</Text>
                </Button>
              ) : (
                <Button variant="destructive" size="sm" onPress={confirmLeave}>
                  <Text className="font-body-semibold text-white">Leave household</Text>
                </Button>
              )}
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
