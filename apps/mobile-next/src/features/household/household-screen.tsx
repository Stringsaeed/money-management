import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { useLedgerScope } from "@/navigation/ledger-scope-context";
import { Button, EmptyState, Screen, Surface, Text, TextField } from "@/ui";
import { colors, spacing } from "@/ui/design-tokens";

import { useSession } from "../auth/use-session";
import { useHousehold } from "./use-household";

// eslint-disable-next-line complexity -- this screen coordinates the simple household states and actions.
export function HouseholdScreen() {
  const session = useSession();
  const { scope, selectScope } = useLedgerScope();
  const state = useHousehold(session.status === "signed_in");
  const [createName, setCreateName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  if (session.status !== "signed_in") {
    return (
      <Screen style={styles.screen}>
        <EmptyState
          title="Sign in to share"
          message="Households are available after WorkOS sign-in."
        />
      </Screen>
    );
  }

  const currentPrincipal = session.principal;
  const userId = currentPrincipal?.kind === "user" ? currentPrincipal.userId : null;
  const activeMembers =
    state.household?.members.filter((member) => member.status === "active") ?? [];
  const adminCount = activeMembers.filter((member) => member.role === "admin").length;
  const onlyAdmin = state.household?.role === "admin" && adminCount <= 1;

  if (state.loading) {
    return (
      <Screen style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading household" color={colors.sage} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="headline">Household</Text>
          <Text variant="body" style={styles.muted}>
            Share one ledger with people you trust.
          </Text>
        </View>

        {!state.household ? (
          <Surface variant="raised">
            <Text variant="title">Create a household</Text>
            <Text variant="body" style={styles.muted}>
              You can create one household. You can leave it after another member becomes an admin.
            </Text>
            <TextField
              label="Name"
              value={createName}
              onChangeText={setCreateName}
              placeholder="e.g. Home"
            />
            <Button
              title="Create household"
              onPress={() => {
                if (!createName.trim()) return;
                void state.create(createName.trim()).then(() => setCreateName(""));
              }}
              loading={state.busy}
            />
          </Surface>
        ) : (
          <>
            <Surface variant="raised">
              <Text variant="title">{state.household.name}</Text>
              <Text variant="caption">{activeMembers.length} active member(s)</Text>
              {scope.kind === "personal" ? (
                <Button
                  title="Use household ledger"
                  onPress={() =>
                    selectScope({ kind: "household", householdId: state.household!.householdId })
                  }
                  loading={state.busy}
                />
              ) : (
                <Button
                  title="Use personal ledger"
                  variant="secondary"
                  onPress={() => selectScope({ kind: "personal" })}
                  loading={state.busy}
                />
              )}
            </Surface>

            <Surface variant="raised">
              <Text variant="title">Members</Text>
              <View style={styles.members}>
                {activeMembers.map((member) => (
                  <View key={member.membershipId} style={styles.member}>
                    <View style={styles.memberCopy}>
                      <Text>{member.userName || member.userEmail}</Text>
                      <Text variant="caption">{member.role}</Text>
                    </View>
                    {state.household?.role === "admin" &&
                    member.role !== "admin" &&
                    member.userId !== userId ? (
                      <Button
                        title="Make admin"
                        variant="secondary"
                        onPress={() => void state.makeAdmin(member.userId)}
                        loading={state.busy}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            </Surface>

            {state.household.role === "admin" ? (
              <Surface variant="raised">
                <Text variant="title">Invite someone</Text>
                <Text variant="body" style={styles.muted}>
                  They will receive a WorkOS invitation. After accepting the email, they should sign
                  in to Trove Next.
                </Text>
                <TextField
                  label="Email"
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  title="Send invitation"
                  onPress={() => {
                    if (!inviteEmail.trim()) return;
                    void state.invite(inviteEmail.trim()).then(() => setInviteEmail(""));
                  }}
                  loading={state.busy}
                />
              </Surface>
            ) : null}

            <Button
              title="Leave household"
              variant="ghost"
              disabled={onlyAdmin}
              onPress={() => void state.leave().then(() => selectScope({ kind: "personal" }))}
              loading={state.busy}
            />
            {onlyAdmin ? (
              <Text variant="caption" style={styles.muted}>
                You are the only admin. Make another member an admin before leaving.
              </Text>
            ) : null}
          </>
        )}

        {state.notice ? <Text style={styles.notice}>{state.notice}</Text> : null}
        {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing[5] },
  loading: { alignItems: "center", justifyContent: "center" },
  content: { gap: spacing[4], paddingBottom: spacing[8], paddingTop: spacing[3] },
  header: { gap: spacing[2] },
  muted: { color: colors.mutedForeground },
  members: { gap: spacing[3] },
  member: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[3],
    justifyContent: "space-between",
  },
  memberCopy: { flex: 1, gap: spacing[1] },
  notice: { color: colors.sage },
  error: { color: colors.destructive },
});
