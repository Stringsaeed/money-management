import { Button, layout, ListGroup, ListRow } from "@/ui/trove";

import type { HouseholdDetail } from "./household-client";

type Member = HouseholdDetail["members"][number];

interface HouseholdMembersListProps {
  readonly members: readonly Member[];
  /** Admins can promote other members. */
  readonly canPromote: boolean;
  readonly currentUserId: string | null;
  readonly busy: boolean;
  readonly onMakeAdmin: (userId: string) => void;
}

export function HouseholdMembersList({
  members,
  canPromote,
  currentUserId,
  busy,
  onMakeAdmin,
}: HouseholdMembersListProps) {
  return (
    <ListGroup dividerInset={layout.cardPadding} header="Members">
      {members.map((member) => (
        <ListRow
          key={member.membershipId}
          subtitle={member.role}
          title={member.userName || member.userEmail}
          trailing={
            canPromote && member.role !== "admin" && member.userId !== currentUserId ? (
              <Button
                label="Make admin"
                loading={busy}
                onPress={() => onMakeAdmin(member.userId)}
                size="sm"
                variant="secondary"
              />
            ) : undefined
          }
        />
      ))}
    </ListGroup>
  );
}
