import { Toaster } from "@/lib/sonner";

const INK = "#2c5f47";
const SURFACE = "#f5f5f0";
const SURFACE_DIM = "#d9e4db";
const OUTLINE = "#d5e0d7";
const SAGE = "#4a8f69";
const TERRACOTTA = "#d46a4c";

/**
 * Paper Ledger–themed host for global status toasts.
 * Style props are required by sonner-native (no className API).
 */
export function LedgerToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      swipeToDismissDirection="up"
      visibleToasts={3}
      offset={12}
      gap={8}
      theme="light"
      toastOptions={{
        style: {
          backgroundColor: SURFACE,
          borderWidth: 1,
          borderColor: OUTLINE,
          borderRadius: 12,
        },
        titleStyle: {
          color: INK,
          fontFamily: "Nunito_600SemiBold",
          fontSize: 14,
        },
        descriptionStyle: {
          color: `${INK}8C`,
          fontFamily: "Nunito_400Regular",
          fontSize: 12,
          lineHeight: 18,
        },
        actionButtonStyle: {
          backgroundColor: INK,
          borderRadius: 8,
        },
        actionButtonTextStyle: {
          color: SURFACE,
          fontFamily: "Nunito_600SemiBold",
          fontSize: 12,
        },
        cancelButtonStyle: {
          backgroundColor: SURFACE_DIM,
          borderRadius: 8,
        },
        cancelButtonTextStyle: {
          color: INK,
          fontFamily: "Nunito_600SemiBold",
          fontSize: 12,
        },
        closeButtonStyle: {
          backgroundColor: SURFACE_DIM,
          borderColor: OUTLINE,
        },
        success: { borderColor: SAGE },
        warning: { borderColor: TERRACOTTA },
        error: { borderColor: TERRACOTTA },
        info: { borderColor: OUTLINE },
      }}
    />
  );
}
