import type { HouseholdDetail } from "@/features/household/household-client";

type Member = HouseholdDetail["members"][number];

/** One Monthly shares tile: the member, their initial, and whether it is the person setting up. */
export interface ShareTileModel {
  readonly userId: string;
  readonly name: string;
  readonly initial: string;
  readonly isYou: boolean;
}

const displayName = (member: Member): string =>
  member.userName.trim() || member.userEmail.trim() || "Member";

const activeMembers = (household: HouseholdDetail | null): Member[] =>
  household?.members.filter((member) => member.status === "active") ?? [];

/** Active members as share tiles, the person setting up first as "You". */
export function shareTiles(
  household: HouseholdDetail | null,
  userId: string | null,
): ShareTileModel[] {
  const tiles = activeMembers(household).map((member): ShareTileModel => {
    const isYou = member.userId === userId;
    const name = isYou ? "You" : displayName(member);
    return {
      userId: member.userId,
      name,
      initial: (name.at(0) ?? "?").toUpperCase(),
      isYou,
    };
  });
  return [...tiles.filter((tile) => tile.isYou), ...tiles.filter((tile) => !tile.isYou)];
}

/** Tiles in rows of two, for the two-column grid. */
export const inPairs = <T>(items: readonly T[]): T[][] =>
  Array.from({ length: Math.ceil(items.length / 2) }, (_, row) =>
    items.slice(row * 2, row * 2 + 2),
  );

const joinNames = (names: readonly string[]): string =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;

/**
 * The 👥 line: what the other members may do, then who changes the plan. Members add spending,
 * mark bills paid and move money; viewers only look; admins change plan amounts.
 */
export function rolesLine(household: HouseholdDetail | null, userId: string | null): string | null {
  const others = activeMembers(household).filter((member) => member.userId !== userId);
  if (others.length === 0) return null;
  const firstName = (member: Member) => displayName(member).split(" ")[0] ?? displayName(member);
  const members = others.filter((member) => member.role === "member").map(firstName);
  const viewers = others.filter((member) => member.role === "viewer").map(firstName);
  const admins = others.filter((member) => member.role === "admin").map(firstName);
  const youAdmin = household?.role === "admin";
  const parts: string[] = [];
  if (members.length > 0) {
    parts.push(`${joinNames(members)} can add spending, mark bills paid and move money.`);
  }
  if (viewers.length > 0) parts.push(`${joinNames(viewers)} can view the budget.`);
  if (!youAdmin) parts.push("Only admins change plan amounts.");
  else if (admins.length === 0) parts.push("Only you change plan amounts.");
  else parts.push(`You and ${joinNames(admins)} change plan amounts.`);
  return parts.join(" ");
}
