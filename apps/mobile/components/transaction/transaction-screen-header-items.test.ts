import { describe, expect, it, jest } from "@jest/globals";

import {
  existingTransactionHeaderItems,
  newTransactionHeaderItems,
} from "./transaction-screen-header-items";

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
