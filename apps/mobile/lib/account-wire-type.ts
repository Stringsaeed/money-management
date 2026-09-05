/** Server ledger account kinds accepted by import_bundle and synced commands. */
export type WireAccountType = "cash" | "bank" | "card";

/**
 * Local accounts use product types (`checking`, `savings`, `credit_card`, …).
 * The API wire shape only accepts cash|bank|card.
 */
export function toWireAccountType(type: string): WireAccountType {
  if (type === "cash") return "cash";
  if (type === "credit_card") return "card";
  return "bank";
}
