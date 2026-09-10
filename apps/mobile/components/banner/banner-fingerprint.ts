import type { LocalOnlyReason } from "@/stores/sync-mode-store";
import type { SettlementReport } from "@/modules/recurring-rules";

export function accessFingerprint(kind: "session_revoked"): string {
  return kind;
}

export function syncFingerprint(reason: LocalOnlyReason): string {
  return `local_only:${reason}`;
}

function attentionRuleCount(report: SettlementReport | null): number {
  return (
    report?.rules.filter((rule) => rule.kind === "failed" || rule.kind === "needs_attention")
      .length ?? 0
  );
}

export function settlementFingerprint(input: {
  report: SettlementReport | null;
  error: Error | null;
  unresolved: boolean;
}): string | null {
  const { report, error, unresolved } = input;
  const generatedCount = report?.generatedCount ?? 0;
  if (!unresolved && generatedCount <= 0) return null;

  const startedAt = report?.startedAt ?? "none";
  if (unresolved) {
    return `attention:${startedAt}:${error?.message ?? ""}:${attentionRuleCount(report)}`;
  }
  return `success:${startedAt}:${generatedCount}`;
}
