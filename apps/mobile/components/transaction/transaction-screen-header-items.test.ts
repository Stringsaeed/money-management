import { describe, expect, it, jest } from "@jest/globals";

import { existingTransactionHeaderItems } from "./transaction-screen-header-items";

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
