import { describe, expect, it, jest } from "@jest/globals";

import type { RecurringRule, RecurringRuleLifecycle } from "@/modules/recurring-rules";

import {
  existingTransactionHeaderItems,
  newTransactionHeaderItems,
  recurringRuleHeaderItems,
} from "./transaction-screen-header-items";

const ruleWithLifecycle = (lifecycle: RecurringRuleLifecycle): RecurringRule =>
  ({ id: "rule_1", lifecycle }) as RecurringRule;

describe("newTransactionHeaderItems", () => {
  it("toggles recurring label/icon and appends save for one-time vs recurring", () => {
    const onSave = jest.fn();
    const onToggleRecurring = jest.fn();

    const oneTime = newTransactionHeaderItems({
      isRecurring: false,
      onSave,
      onToggleRecurring,
    });
    expect(oneTime).toHaveLength(2);
    expect(oneTime[0]).toMatchObject({
      label: "Make recurring",
      type: "button",
      onPress: onToggleRecurring,
      icon: { type: "sfSymbol", name: "1.circle" },
      sharesBackground: false,
    });
    expect(oneTime[1]).toMatchObject({
      label: "save",
      type: "button",
      onPress: onSave,
      icon: { type: "sfSymbol", name: "checkmark" },
    });

    const recurring = newTransactionHeaderItems({
      isRecurring: true,
      onSave,
      onToggleRecurring,
    });
    expect(recurring[0]).toMatchObject({
      label: "Make one-time",
      icon: { type: "sfSymbol", name: "repeat.circle" },
      sharesBackground: false,
    });
  });

  it("wires toggle and save presses to the provided callbacks", () => {
    const onSave = jest.fn();
    const onToggleRecurring = jest.fn();
    const [toggleItem, saveItem] = newTransactionHeaderItems({
      isRecurring: false,
      onSave,
      onToggleRecurring,
    });

    expect(toggleItem?.type).toBe("button");
    expect(saveItem?.type).toBe("button");
    if (toggleItem?.type === "button") toggleItem.onPress();
    if (saveItem?.type === "button") saveItem.onPress();

    expect(onToggleRecurring).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("existingTransactionHeaderItems", () => {
  it("returns a red delete button then a save button without shared background", () => {
    const onDelete = jest.fn();
    const onSave = jest.fn();

    const items = existingTransactionHeaderItems({ onDelete, onSave });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      label: "delete",
      type: "button",
      onPress: onDelete,
      icon: { type: "sfSymbol", name: "trash" },
      tintColor: "red",
    });
    expect(items[1]).toMatchObject({
      label: "save",
      type: "button",
      onPress: onSave,
      icon: { type: "sfSymbol", name: "checkmark" },
      sharesBackground: false,
    });
  });

  it("wires delete and save presses to the provided callbacks", () => {
    const onDelete = jest.fn();
    const onSave = jest.fn();
    const [deleteItem, saveItem] = existingTransactionHeaderItems({ onDelete, onSave });

    expect(deleteItem?.type).toBe("button");
    expect(saveItem?.type).toBe("button");
    if (deleteItem?.type === "button") deleteItem.onPress();
    if (saveItem?.type === "button") saveItem.onPress();

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe("recurringRuleHeaderItems", () => {
  it("for active rules returns pause, archive, and tinted save", () => {
    const onArchive = jest.fn();
    const onLifecycleChange = jest.fn();
    const onSave = jest.fn();

    const items = recurringRuleHeaderItems({
      iconTintColor: "#123456",
      onArchive,
      onLifecycleChange,
      onSave,
      rule: ruleWithLifecycle("active"),
    });

    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      label: "Pause active Rule",
      type: "button",
      icon: { type: "sfSymbol", name: "pause.circle" },
      tintColor: "#123456",
    });
    expect(items[1]).toMatchObject({
      label: "Archive Rule",
      type: "button",
      onPress: onArchive,
      icon: { type: "sfSymbol", name: "archivebox" },
      tintColor: "#D46A4C",
    });
    expect(items[2]).toMatchObject({
      label: "save",
      type: "button",
      onPress: onSave,
      icon: { type: "sfSymbol", name: "checkmark" },
      tintColor: "#123456",
    });

    if (items[0]?.type === "button") items[0].onPress();
    expect(onLifecycleChange).toHaveBeenCalledWith("pause");
  });

  it("for archived rules restores without archive and resumes when paused", () => {
    const onArchive = jest.fn();
    const onLifecycleChange = jest.fn();
    const onSave = jest.fn();

    const archived = recurringRuleHeaderItems({
      iconTintColor: "#abcdef",
      onArchive,
      onLifecycleChange,
      onSave,
      rule: ruleWithLifecycle("archived"),
    });
    expect(archived).toHaveLength(2);
    expect(archived[0]).toMatchObject({
      label: "Restore archived Rule",
      icon: { type: "sfSymbol", name: "arrow.uturn.backward.circle" },
    });
    expect(archived.map((item) => (item.type === "button" ? item.label : null))).not.toContain(
      "Archive Rule",
    );
    if (archived[0]?.type === "button") archived[0].onPress();
    expect(onLifecycleChange).toHaveBeenCalledWith("restore");

    const paused = recurringRuleHeaderItems({
      iconTintColor: "#abcdef",
      onArchive,
      onLifecycleChange,
      onSave,
      rule: ruleWithLifecycle("paused"),
    });
    expect(paused[0]).toMatchObject({
      label: "Resume paused Rule",
      icon: { type: "sfSymbol", name: "play.circle" },
    });
    expect(paused).toHaveLength(3);
    if (paused[0]?.type === "button") paused[0].onPress();
    expect(onLifecycleChange).toHaveBeenLastCalledWith("resume");
  });
});
