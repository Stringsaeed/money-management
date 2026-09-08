import { View } from "react-native";

import { ActiveHouseholdPanel } from "@/components/household/active-household-panel";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import { JoinHouseholdForm } from "@/components/household/join-household-form";
import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";
import { useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { useHouseholdDetail } from "@/hooks/use-households";
import type { AccessState } from "@/modules/access";

type SignedInAccess = Extract<AccessState, { kind: "signed_in" }>;

export function SignedInHousehold({ access }: { readonly access: SignedInAccess }) {
  const { data: detail } = useHouseholdDetail(
    access.household.kind === "active" ? access.household.householdId : null,
  );
  const { data: migratedHouseholdId } = useMigratedHouseholdId();
  const active = access.household.kind === "active" ? access.household : null;
  const isOwner =
    detail?.members.some(
      (member) => member.userId === access.user.userId && member.role === "owner",
    ) ?? false;

  return (
    <>
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
              <NativeSecondaryButton
                label="Sign out"
                onPress={access.signOut}
                testID="profile-sign-out"
              />
            </NativeHost>
          </View>
        </View>
      </Card>

      {access.household.kind === "unavailable" ? (
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
      ) : null}

      {access.memberships.length > 1 ? (
        <Card>
          <View className="gap-3 p-4">
            <Text className="font-body-semibold text-xs uppercase text-ink/40">
              Active Household
            </Text>
            <View className="gap-2">
              {access.memberships.map((household) => {
                const selected = household.householdId === active?.householdId;
                return (
                  <NativeHost key={household.householdId}>
                    {selected ? (
                      <NativePrimaryButton
                        label={`${household.name} ✓`}
                        onPress={() => access.setActiveHousehold(household.householdId)}
                        testID={`select-household-${household.householdId}`}
                      />
                    ) : (
                      <NativeSecondaryButton
                        label={household.name}
                        onPress={() => access.setActiveHousehold(household.householdId)}
                        testID={`select-household-${household.householdId}`}
                      />
                    )}
                  </NativeHost>
                );
              })}
            </View>
          </View>
        </Card>
      ) : null}

      {active ? (
        <ActiveHouseholdPanel
          householdId={active.householdId}
          name={active.name}
          currentUserId={access.user.userId}
          isOwner={isOwner}
          needsSync={migratedHouseholdId !== active.householdId}
          members={detail?.members ?? []}
        />
      ) : (
        <>
          <Card>
            <View className="p-4">
              <Text className="mb-3 font-body-semibold text-sm">Create a Household</Text>
              <CreateHouseholdForm />
            </View>
          </Card>
          <Card>
            <View className="p-4">
              <Text className="mb-3 font-body-semibold text-sm">Join with Invite Code</Text>
              <JoinHouseholdForm />
            </View>
          </Card>
        </>
      )}
    </>
  );
}
