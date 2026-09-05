import { SessionRevokedCard } from "@/components/access/session-revoked-card";
import { SignedOutCard } from "@/components/access/signed-out-card";
import { SignedInHousehold } from "@/components/household/signed-in-household";
import { Text } from "@/components/ui/text";
import { returnTo, useAccess } from "@/modules/access";
import { ScrollView } from "react-native";

export default function HouseholdScreen() {
  const access = useAccess();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-2 px-4 bg-background grow"
    >
      {access.kind === "resolving" ? (
        <Text className="text-muted-foreground px-1 py-6 text-sm">Loading…</Text>
      ) : null}
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
