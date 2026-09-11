import type { HouseholdRole } from "@trove/protocol";
import { View } from "react-native";

import { roleLabel } from "@/modules/access/memberships";
import { Text } from "@/components/ui/text";

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
  /** @deprecated Ownership transfer removed; kept optional for call-site churn. */
  isOwner?: boolean;
  householdId?: string;
}) {
  return (
    <View>
      {members.map((member) => (
        <View
          key={member.userId}
          className="flex-row items-center gap-3 border-b border-ledger-outline px-4 py-3 last:border-b-0"
        >
          <View className="flex-1">
            <Text className="font-body-medium text-base text-ink">
              {member.userName}
              {member.userId === currentUserId ? " (you)" : ""}
            </Text>
            <Text className="font-body-normal text-xs text-ink/40">{member.userEmail}</Text>
          </View>
          <Text className="font-body-semibold text-xs uppercase tracking-wide text-ink/40">
            {member.role === "admin" ? "👑 " : ""}
            {roleLabel(member.role)}
          </Text>
        </View>
      ))}
      {members.length === 0 ? (
        <Text className="px-4 py-3 text-xs text-ink/40">No members yet.</Text>
      ) : null}
    </View>
  );
}
