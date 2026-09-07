export const REQUIRED_PRODUCTION_CUTOVER_APPROVAL = "issue-173-approved";

export function assertProductionCutoverApproved(stage: string, approval: string): void {
  if (stage !== "prod") return;
  if (approval === REQUIRED_PRODUCTION_CUTOVER_APPROVAL) return;

  throw new Error(
    "Production PlanetScale cutover is blocked. Close #173, finish the D1 export/import parity checks, then set PLANETSCALE_CUTOVER_APPROVED=issue-173-approved.",
  );
}
