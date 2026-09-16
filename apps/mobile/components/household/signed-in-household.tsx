import { isHouseholdRole } from "@trove/protocol";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SignOutPendingSheet } from "@/components/access/sign-out-pending-sheet";
import { ActiveHouseholdPanel } from "@/components/household/active-household-panel";
import { CreateHouseholdForm } from "@/components/household/create-household-form";
import type { HouseholdMember } from "@/components/household/household-members";
import { LedgerSelector } from "@/components/household/ledger-selector";
import { PersonalSyncCard } from "@/components/household/personal-sync-card";
import {
  NativeHost,
  NativePrimaryButton,
  NativeSecondaryButton,
  NativeTertiaryButton,
} from "@/components/native-ui";
import { Card } from "@/components/settings/card";
import { ModalBottomSheet } from "@/components/ui/modal-bottom-sheet";
import { Text } from "@/components/ui/text";
import { useSyncEnrollment } from "@/hooks/use-enable-sync";
import { useHouseholdDetail } from "@/hooks/use-households";
import { useSignOutRequest } from "@/hooks/use-sign-out";
import { colors, spacing, typography } from "@/lib/design-tokens";
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
      <View style={styles.profileContainer}>
        <View style={styles.profileRow}>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{access.user.displayName}</Text>
            <Text style={styles.profileEmail}>{access.user.email}</Text>
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
      <View style={styles.unavailableRow}>
        <View style={styles.unavailableContent}>
          <Text style={styles.unavailableTitle}>Household sync is paused</Text>
          <Text style={styles.unavailableSubtitle}>
            Your ledger on this device is still usable.
          </Text>
        </View>
        <NativeHost fillWidth={false}>
          <NativeTertiaryButton
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
  const [open, setOpen] = useState(false);
  return (
    <>
      <Card>
        <View style={styles.setupContainer}>
          <View style={styles.setupContent}>
            <Text style={styles.setupTitle}>Set up this ledger</Text>
            <Text style={styles.setupSubtitle}>
              Sync just for you, start a shared household, or join one you were invited to.
            </Text>
          </View>
          <NativeHost>
            <NativePrimaryButton
              label="Set up household ledger"
              onPress={() => setOpen(true)}
              testID="open-household-actions"
            />
          </NativeHost>
        </View>
      </Card>
      <HouseholdActionsSheet
        open={open}
        onClose={() => setOpen(false)}
        personalEnabled={personalEnabled}
      />
    </>
  );
}

const CONTENT_BOTTOM_PADDING = 32;

function HouseholdActionsSheet({
  open,
  onClose,
  personalEnabled,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly personalEnabled: boolean;
}) {
  const insets = useSafeAreaInsets();
  const sheetBottomPadding = insets.bottom + CONTENT_BOTTOM_PADDING;
  const { height } = useReanimatedKeyboardAnimation();
  const keyboardPaddingStyle = useAnimatedStyle(() => ({
    paddingBottom: Math.max(
      sheetBottomPadding,
      Math.max(0, -height.value) + CONTENT_BOTTOM_PADDING,
    ),
  }));

  return (
    <ModalBottomSheet open={open} onDismiss={onClose} animateContentHeight={false}>
      <Animated.View style={keyboardPaddingStyle}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Household ledger</Text>
          <PersonalSyncCard alreadyEnabled={personalEnabled} />
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Create a Household</Text>
            <CreateHouseholdForm />
          </View>
          <View style={styles.joinSection}>
            <Text style={styles.sectionTitle}>Join a Household</Text>
            <Text style={styles.joinDescription}>
              Accept the WorkOS invitation email (hosted AuthKit). Custom invite codes are gone —
              joining never moves your Personal ledger into the shared one.
            </Text>
          </View>
        </View>
      </Animated.View>
    </ModalBottomSheet>
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

const styles = StyleSheet.create({
  profileContainer: {
    gap: spacing[3],
    padding: spacing[4],
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileInfo: {
    gap: spacing[1],
  },
  profileName: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  profileEmail: {
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  unavailableRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    padding: spacing[4],
  },
  unavailableContent: {
    flex: 1,
    gap: spacing[0.5],
  },
  unavailableTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  unavailableSubtitle: {
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.6,
  },
  setupContainer: {
    gap: spacing[3],
    padding: spacing[4],
  },
  setupContent: {
    gap: spacing[1],
  },
  setupTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  setupSubtitle: {
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  sheetContent: {
    gap: spacing[5],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  sheetTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  sectionGroup: {
    gap: spacing[1],
  },
  sectionTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  joinSection: {
    gap: spacing[1],
    paddingBottom: spacing[2],
  },
  joinDescription: {
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
});
