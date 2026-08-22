import type {
  NativeStackHeaderItem,
  NativeStackHeaderItemButton,
} from "expo-router/build/react-navigation/native-stack";

import type { RecurringRule } from "@/modules/recurring-rules";

type RecurringLifecycleAction = "pause" | "resume" | "restore";

interface NewTransactionHeaderItemsOptions {
  isRecurring: boolean;
  onSave: VoidFunction;
  onToggleRecurring: VoidFunction;
}

interface ExistingTransactionHeaderItemsOptions {
  onDelete: VoidFunction;
  onSave: VoidFunction;
}

interface RecurringRuleHeaderItemsOptions {
  iconTintColor: string;
  onArchive: VoidFunction;
  onLifecycleChange: (action: RecurringLifecycleAction) => void;
  onSave: VoidFunction;
  rule: RecurringRule;
}

export function newTransactionHeaderItems({
  isRecurring,
  onSave,
  onToggleRecurring,
}: NewTransactionHeaderItemsOptions): NativeStackHeaderItem[] {
  return [
    {
      label: isRecurring ? "Make one-time" : "Make recurring",
      type: "button",
      onPress: onToggleRecurring,
      icon: { type: "sfSymbol", name: isRecurring ? "repeat.circle" : "1.circle" },
      sharesBackground: false,
    },
    saveItem(onSave),
  ];
}

export function existingTransactionHeaderItems({
  onDelete,
  onSave,
}: ExistingTransactionHeaderItemsOptions): NativeStackHeaderItem[] {
  return [
    {
      label: "delete",
      type: "button",
      onPress: onDelete,
      icon: { type: "sfSymbol", name: "trash" },
      tintColor: "red",
    },
    { ...saveItem(onSave), sharesBackground: false },
  ];
}

export function recurringRuleHeaderItems({
  iconTintColor,
  onArchive,
  onLifecycleChange,
  onSave,
  rule,
}: RecurringRuleHeaderItemsOptions): NativeStackHeaderItem[] {
  const lifecycleItem = lifecycleHeaderItem(rule, iconTintColor, onLifecycleChange);
  const items: NativeStackHeaderItem[] = lifecycleItem ? [lifecycleItem] : [];

  if (rule.lifecycle !== "archived") {
    items.push({
      label: "Archive Rule",
      type: "button",
      onPress: onArchive,
      icon: { type: "sfSymbol", name: "archivebox" },
      tintColor: "#D46A4C",
    });
  }

  items.push({ ...saveItem(onSave), tintColor: iconTintColor });
  return items;
}

function lifecycleHeaderItem(
  rule: RecurringRule,
  tintColor: string,
  onLifecycleChange: (action: RecurringLifecycleAction) => void,
): NativeStackHeaderItem | null {
  if (rule.lifecycle === "active") {
    return {
      label: "Pause active Rule",
      type: "button",
      onPress: () => onLifecycleChange("pause"),
      icon: { type: "sfSymbol", name: "pause.circle" },
      tintColor,
    };
  }
  if (rule.lifecycle === "paused") {
    return {
      label: "Resume paused Rule",
      type: "button",
      onPress: () => onLifecycleChange("resume"),
      icon: { type: "sfSymbol", name: "play.circle" },
      tintColor,
    };
  }
  if (rule.lifecycle === "archived") {
    return {
      label: "Restore archived Rule",
      type: "button",
      onPress: () => onLifecycleChange("restore"),
      icon: { type: "sfSymbol", name: "arrow.uturn.backward.circle" },
      tintColor,
    };
  }
  return null;
}

function saveItem(onSave: VoidFunction): NativeStackHeaderItemButton {
  return {
    label: "save",
    type: "button",
    onPress: onSave,
    icon: { type: "sfSymbol", name: "checkmark" },
  };
}
