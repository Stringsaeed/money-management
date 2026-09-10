import { router } from "expo-router";
import { Text } from "react-native";

import { BANNER_TOAST_IDS, SUCCESS_TOAST_MS } from "@/components/banner/banner-channel";
import { settlementFingerprint } from "@/components/banner/banner-fingerprint";
import {
  forgetBannerDismiss,
  markBannerDismissed,
  useSyncBannerToast,
} from "@/components/banner/use-sync-banner-toast";
import { useRecurringSettlementFeedback } from "@/components/recurring/recurring-settlement-provider";
import { toast } from "@/lib/sonner";

export function RecurringSettlementBanner() {
  const { dismiss, error, report, retry } = useRecurringSettlementFeedback();
  const unresolved =
    error !== null ||
    report?.rules.some((rule) => rule.kind === "failed" || rule.kind === "needs_attention") ===
      true;
  const showSuccess = (report?.generatedCount ?? 0) > 0;
  const fingerprint = settlementFingerprint({ report, error, unresolved });

  useSyncBannerToast({
    channel: "settlement",
    fingerprint: unresolved || showSuccess ? fingerprint : null,
    present: () => {
      if (fingerprint == null) return;

      if (unresolved) {
        const affectedCount =
          report?.rules.filter((rule) => rule.kind === "failed" || rule.kind === "needs_attention")
            .length ?? 0;
        toast.error("Recurring Rules need attention", {
          id: BANNER_TOAST_IDS.settlement,
          description: `${affectedCount || 1} ${affectedCount === 1 ? "Rule needs" : "Rules need"} review before it can continue.`,
          duration: Number.POSITIVE_INFINITY,
          icon: <Text>⚠️</Text>,
          closeButton: true,
          onDismiss: () => markBannerDismissed("settlement", fingerprint),
          cancel: {
            label: "Try again",
            onClick: () => {
              forgetBannerDismiss("settlement");
              void retry();
            },
          },
          action: {
            label: "Review Rules",
            onClick: () => {
              markBannerDismissed("settlement", fingerprint);
              router.push({
                pathname: "/recurring",
                params: { filter: "needs_attention" },
              });
            },
          },
        });
        return;
      }

      const count = report?.generatedCount ?? 0;
      toast.success("Recurring transactions added", {
        id: BANNER_TOAST_IDS.settlement,
        description: `${count} scheduled ${count === 1 ? "transaction was" : "transactions were"} added.`,
        duration: SUCCESS_TOAST_MS,
        icon: <Text>✅</Text>,
        closeButton: true,
        onDismiss: () => {
          markBannerDismissed("settlement", fingerprint);
          dismiss();
        },
        onAutoClose: () => {
          markBannerDismissed("settlement", fingerprint);
          dismiss();
        },
      });
    },
  });

  return null;
}
