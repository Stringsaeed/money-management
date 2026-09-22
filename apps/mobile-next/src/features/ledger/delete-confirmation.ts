import { Alert } from "react-native";

type LedgerResource = "account" | "category";

export function confirmLedgerDeletion(
  resource: LedgerResource,
  name: string,
  onConfirm: () => void,
): void {
  const label = resource === "account" ? "account" : "category";
  const linkedData =
    resource === "account"
      ? "Every linked transaction, including transfers to or from this account, and every recurring schedule"
      : "Every linked transaction and recurring schedule";

  Alert.alert(`Delete ${name}?`, `${linkedData} will be removed. This cannot be undone.`, [
    { text: "Cancel", style: "cancel" },
    { text: `Delete ${label}`, style: "destructive", onPress: onConfirm },
  ]);
}
