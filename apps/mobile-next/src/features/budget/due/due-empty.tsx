import { EmptyState } from "@/ui/trove";

/** Nothing pending, no salary to expect, and nothing paid yet this period. */
export function DueEmpty() {
  return (
    <EmptyState
      title="Nothing due"
      message="Bills you set up as reminders show here before they are due. Nothing is recorded until you mark it paid."
      framed={false}
    />
  );
}
