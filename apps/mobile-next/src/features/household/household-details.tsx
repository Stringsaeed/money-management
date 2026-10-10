import type { V2LedgerScope } from "@trove/api/v2/contracts";

import { Button, Text } from "@/ui/trove";

import type { HouseholdDetail } from "./household-client";
import { HouseholdInviteCard } from "./household-invite-card";
import { HouseholdMembersList } from "./household-members-list";
import { HouseholdOverviewCard } from "./household-overview-card";
import type { HouseholdState } from "./use-household";

interface HouseholdDetailsProps {
  readonly household: HouseholdDetail;
  readonly state: HouseholdState;
  readonly scope: V2LedgerScope;
  readonly userId: string | null;
  readonly onSelectScope: (scope: V2LedgerScope) => void;
}

export function HouseholdDetails({
  household,
  state,
  scope,
  userId,
  onSelectScope,
}: HouseholdDetailsProps) {
  const activeMembers = household.members.filter((member) => member.status === "active");
  const isAdmin = household.role === "admin";
  const adminCount = activeMembers.filter((member) => member.role === "admin").length;
  const onlyAdmin = isAdmin && adminCount <= 1;

  return (
    <>
      <HouseholdOverviewCard
        activeMemberCount={activeMembers.length}
        busy={state.busy}
        household={household}
        onSelectScope={onSelectScope}
        scope={scope}
      />
      <HouseholdMembersList
        busy={state.busy}
        canPromote={isAdmin}
        currentUserId={userId}
        members={activeMembers}
        onMakeAdmin={(memberId) => void state.makeAdmin(memberId)}
      />
      {isAdmin ? <HouseholdInviteCard busy={state.busy} onInvite={state.invite} /> : null}
      <Button
        disabled={onlyAdmin}
        fullWidth
        label="Leave household"
        loading={state.busy}
        onPress={() => void state.leave().then(() => onSelectScope({ kind: "personal" }))}
        variant="tertiary"
      />
      {onlyAdmin ? (
        <Text tone="secondary" variant="bodySm">
          You are the only admin. Make another member an admin before leaving.
        </Text>
      ) : null}
    </>
  );
}
