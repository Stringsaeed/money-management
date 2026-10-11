import { PaydayGate } from "./payday-gate";
import { PlanMonthContent } from "./plan-month-content";

/** C3: Plan new month, the last step of the payday ritual. It lands on Budget home. */
export function PlanMonthScreen() {
  return <PaydayGate>{(view) => <PlanMonthContent view={view} />}</PaydayGate>;
}
