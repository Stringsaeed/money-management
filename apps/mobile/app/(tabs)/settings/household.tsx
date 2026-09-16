import { ScrollView, StyleSheet } from "react-native";

import { SessionRevokedCard } from "@/components/access/session-revoked-card";
import { SignedOutCard } from "@/components/access/signed-out-card";
import { SignedInHousehold } from "@/components/household/signed-in-household";
import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { returnTo, useAccess } from "@/modules/access";

export default function HouseholdScreen() {
  const access = useAccess();

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.contentContainer}
    >
      {access.kind === "resolving" ? <Text style={styles.loadingText}>Loading…</Text> : null}
      {access.kind === "anonymous" ? (
        <SignedOutCard onSignIn={() => access.beginAuth(returnTo.profileHousehold())} />
      ) : null}
      {access.kind === "session_revoked" ? (
        <>
          <SessionRevokedCard
            email={access.lastKnown.email}
            onReauthenticate={() => access.reauthenticate(returnTo.profileHousehold())}
            onSignOut={access.signOut}
          />
          <SignedOutCard onSignIn={() => access.reauthenticate(returnTo.profileHousehold())} />
        </>
      ) : null}
      {access.kind === "signed_in" ? <SignedInHousehold access={access} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  loadingText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.mutedForeground,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[6],
  },
});
