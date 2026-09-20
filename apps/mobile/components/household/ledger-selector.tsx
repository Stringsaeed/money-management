import type { HouseholdRole } from "@trove/protocol";
import { StyleSheet, View } from "react-native";

import { NativeHost, NativePrimaryButton, NativeSecondaryButton } from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import type { AccessState, MembershipSummary } from "@/modules/access/types";

type SignedInAccess = Extract<AccessState, { kind: "signed_in" }>;

/** Personal + Household picker; selection is local and validated against Memberships. */
export function LedgerSelector({ access }: { readonly access: SignedInAccess }) {
  if (access.memberships.length === 0) return null;
  return (
    <Card>
      <View style={styles.container}>
        <Text style={styles.label}>Ledger</Text>
        <View style={styles.buttonsRow}>
          <View style={styles.buttonWrapper}>
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
            <View key={household.householdId} style={styles.householdButtonWrapper}>
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

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
    padding: spacing[4],
  },
  label: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    color: colors.ink,
    opacity: 0.4,
  },
  buttonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 120,
  },
  householdButtonWrapper: {
    flex: 1,
    minWidth: 120,
  },
});
