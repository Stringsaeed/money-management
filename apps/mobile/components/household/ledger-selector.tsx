import type { HouseholdRole } from "@trove/protocol";
import { View } from "react-native";

import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";
import type { AccessState, MembershipSummary } from "@/modules/access/types";

type SignedInAccess = Extract<AccessState, { kind: "signed_in" }>;

/** Personal + Household picker; selection is local and validated against Memberships. */
export function LedgerSelector({ access }: { readonly access: SignedInAccess }) {
  if (access.memberships.length === 0) return null;
  return (
    <Card>
      <View className="gap-3 p-4">
        <Text className="font-body-semibold text-xs uppercase text-ink/40">Ledger</Text>
        <View className="flex-row flex-wrap gap-2">
          <View className="min-w-30 flex-1">
            <NativeHost>
              {access.selection.kind === "personal" ? (
                <NativePrimaryButton
                  label="Personal ✓"
                  onPress={() => access.setActiveHousehold(null)}
                  testID="select-ledger-personal"
                />
              ) : (
                <NativeSecondaryButton
                  label="Personal"
                  onPress={() => access.setActiveHousehold(null)}
                  testID="select-ledger-personal"
                />
              )}
            </NativeHost>
          </View>
          {access.memberships.map((household) => (
            <View key={household.householdId} className="min-w-[120px] flex-1">
              <HouseholdOption access={access} household={household} />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}

function HouseholdOption({
  access,
  household,
}: {
  readonly access: SignedInAccess;
  readonly household: MembershipSummary;
}) {
  const selected =
    access.selection.kind === "household" && access.selection.householdId === household.householdId;
  return (
    <NativeHost>
      {selected ? (
        <NativePrimaryButton
          label={`${household.name} ✓`}
          onPress={() => access.setActiveHousehold(household.householdId)}
          testID={`select-household-${household.householdId}`}
        />
      ) : (
        <NativeSecondaryButton
          label={`${household.name} · ${roleHint(household.role)}`}
          onPress={() => access.setActiveHousehold(household.householdId)}
          testID={`select-household-${household.householdId}`}
        />
      )}
    </NativeHost>
  );
}

function roleHint(role: HouseholdRole): string {
  switch (role) {
    case "admin":
      return "admin";
    case "member":
      return "member";
    case "viewer":
      return "viewer";
  }
}
