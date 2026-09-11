import { isHouseholdRole } from "@trove/protocol";
import { View } from "react-native";

import { ActiveHouseholdPanel } from "@/components/household/active-household-panel";
import type { HouseholdMember } from "@/components/household/household-members";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { LedgerSelector } from "@/components/household/ledger-selector";
import { PersonalSyncCard } from "@/components/household/personal-sync-card";
import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";
import { SignOutPendingSheet } from "@/components/access/sign-out-pending-sheet";
import { useSyncEnrollment } from "@/hooks/use-enable-sync";
import { useSignOutRequest } from "@/hooks/use-sign-out";
import { useHouseholdDetail } from "@/hooks/use-households";
import { NO_SYNC_ENROLLMENT, type AccessState } from "@/modules/access";

type SignedInAccess = Extract<AccessState, { kind: "signed_in" }>;

export function SignedInHousehold({ access }: { readonly access: SignedInAccess }) {
  const signOutRequest = useSignOutRequest();
  const { data: detail } = useHouseholdDetail(
    access.household.kind === "active" ? access.household.householdId : null,
  );
  const { data } = useSyncEnrollment();
  const enrollment = data ?? NO_SYNC_ENROLLMENT;
  const active = access.household.kind === "active" ? access.household : null;
  const members = toMembers(detail?.members);
  const isAdmin = active?.role === "admin";

  return (
    <>
      <ProfileCard access={access} onSignOut={signOutRequest.requestSignOut} />
      {signOutRequest.sheetOpen ? (
        <SignOutPendingSheet
          open={signOutRequest.sheetOpen}
          pendingCount={signOutRequest.pendingCount}
          busy={signOutRequest.busy}
          error={signOutRequest.error}
          onSyncThenSignOut={() => void signOutRequest.syncThenSignOut()}
          onDiscardAndSignOut={() => void signOutRequest.discardAndSignOut()}
          onCancel={signOutRequest.cancelSignOut}
        />
      ) : null}
      {access.household.kind === "unavailable" ? <UnavailableCard access={access} /> : null}
      <LedgerSelector access={access} />
      {active ? (
        <ActiveHouseholdPanel
          householdId={active.householdId}
          name={active.name}
          currentUserId={access.user.userId}
          isAdmin={isAdmin}
          needsSync={enrollment.migratedHouseholdId !== active.householdId}
          members={members}
          adminless={detail?.adminless === true}
        />
      ) : (
        <PersonalAndCreateCards
          personalEnabled={enrollment.personalSyncUserId === access.user.userId}
        />
      )}
    </>
  );
}

function ProfileCard({
  access,
  onSignOut,
}: {
  readonly access: SignedInAccess;
  readonly onSignOut: () => void;
}) {
  return (
    <Card>
      <View className="gap-3 p-4">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="font-heading-normal text-lg italic text-ink">
              {access.user.displayName}
            </Text>
            <Text className="text-xs text-ink/50">{access.user.email}</Text>
          </View>
          <NativeHost fillWidth={false}>
            <NativeSecondaryButton label="Sign out" onPress={onSignOut} testID="profile-sign-out" />
          </NativeHost>
        </View>
      </View>
    </Card>
  );
}

function UnavailableCard({ access }: { readonly access: SignedInAccess }) {
  if (access.household.kind !== "unavailable") return null;
  return (
    <Card>
      <View className="gap-2 p-4">
        <Text className="font-body-semibold text-sm text-ink">Household sync is paused</Text>
        <Text className="text-xs text-ink/60">Your ledger on this device is still usable.</Text>
        <NativeHost>
          <NativePrimaryButton
            label="Try again"
            onPress={access.household.retry}
            testID="household-retry"
          />
        </NativeHost>
      </View>
    </Card>
  );
}

function PersonalAndCreateCards({ personalEnabled }: { readonly personalEnabled: boolean }) {
  return (
    <>
      <Card>
        <PersonalSyncCard alreadyEnabled={personalEnabled} />
      </Card>
      <Card>
        <View className="p-4">
          <Text className="mb-3 font-body-semibold text-sm">Create a Household</Text>
          <CreateHouseholdForm />
        </View>
      </Card>
      <Card>
        <View className="gap-2 p-4">
          <Text className="font-body-semibold text-sm">Join a Household</Text>
          <Text className="text-xs text-ink/50">
            Accept the WorkOS invitation email (hosted AuthKit). Custom invite codes are gone —
            joining never moves your Personal ledger into the shared one.
          </Text>
        </View>
      </Card>
    </>
  );
}

function toMembers(
  members:
    | readonly { userId: string; userName: string; userEmail: string; role: string }[]
    | undefined,
): HouseholdMember[] {
  return (members ?? []).flatMap((member) =>
    isHouseholdRole(member.role)
      ? [
          {
            userId: member.userId,
            userName: member.userName,
            userEmail: member.userEmail,
            role: member.role,
          },
        ]
      : [],
  );
}
