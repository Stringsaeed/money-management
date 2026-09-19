import type { HouseholdRole } from "@trove/protocol";
import { StyleSheet, View } from "react-native";

import { Text } from "@/components/ui/text";
import { colors, spacing, typography } from "@/lib/design-tokens";
import { roleLabel } from "@/modules/access/memberships";

export type HouseholdMember = {
  userId: string;
  userName: string;
  userEmail: string;
  role: HouseholdRole;
};

/** Read-only Membership list. Role changes and invitations go through the WorkOS widget. */
export function HouseholdMembers({
  members,
  currentUserId,
}: {
  members: readonly HouseholdMember[];
  currentUserId: string;
}) {
  return (
    <View>
      {members.map((member, index) => (
        <View
          key={member.userId}
          style={[styles.memberRow, index < members.length - 1 && styles.memberRowBorder]}
        >
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>
              {member.userName}
              {member.userId === currentUserId ? " (you)" : ""}
            </Text>
            <Text style={styles.memberEmail}>{member.userEmail}</Text>
          </View>
          <Text style={styles.memberRole}>
            {member.role === "admin" ? "👑 " : ""}
            {roleLabel(member.role)}
          </Text>
        </View>
      ))}
      {members.length === 0 ? <Text style={styles.emptyText}>No members yet.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  memberRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.ledgerOutline,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  memberEmail: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  memberRole: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWide,
    color: colors.ink,
    opacity: 0.4,
  },
  emptyText: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
});
