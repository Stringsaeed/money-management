import { useState } from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { NoteField } from "../note-field";
import { noteCounter, noteLineCount, noteRadius } from "../note-field-utils";
import { radius } from "../../tokens";

function Harness({ initial = "", multiline = false }: { initial?: string; multiline?: boolean }) {
  const [value, setValue] = useState(initial);
  return <NoteField maxLength={280} multiline={multiline} onChangeText={setValue} value={value} />;
}

describe("NoteField", () => {
  it("shows the placeholder and no clear button while empty", async () => {
    await render(<Harness />);
    expect(screen.getByPlaceholderText("Add a note…")).toBeTruthy();
    expect(screen.queryByLabelText("Clear note")).toBeNull();
  });

  it("clears the text with the clear button", async () => {
    await render(<Harness initial="Weekly groceries" />);
    expect(screen.getByDisplayValue("Weekly groceries")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Clear note"));
    expect(screen.getByPlaceholderText("Add a note…").props.value).toBe("");
    expect(screen.queryByLabelText("Clear note")).toBeNull();
  });

  it("reports typed text", async () => {
    await render(<Harness />);
    await fireEvent.changeText(screen.getByPlaceholderText("Add a note…"), "Rent");
    expect(screen.getByDisplayValue("Rent")).toBeTruthy();
  });

  it("hides the decorative emoji from screen readers", async () => {
    await render(<Harness />);
    expect(screen.queryByText("📝")).toBeNull();
    expect(screen.getByText("📝", { includeHiddenElements: true })).toBeTruthy();
  });

  it("multiline: counts characters and steps the radius once it wraps", async () => {
    await render(<Harness initial="Split with Sara and Omar" multiline />);
    expect(screen.getByText("24 / 280")).toBeTruthy();
    expect(screen.queryByLabelText("Clear note")).toBeNull();
    const input = screen.getByPlaceholderText("Add a note…");
    const container = () => {
      let node = input.parent;
      while (node && StyleSheet.flatten(node.props.style)?.borderRadius === undefined) {
        node = node.parent;
      }
      return StyleSheet.flatten(node?.props.style);
    };

    expect(container().borderRadius).toBe(radius.full);
    await fireEvent(input, "contentSizeChange", {
      nativeEvent: { contentSize: { width: 200, height: 72 } },
    });
    expect(container().borderRadius).toBe(radius.lg);
  });
});

describe("note field utils", () => {
  it("counts lines from the content height", () => {
    expect(noteLineCount(0)).toBe(1);
    expect(noteLineCount(24)).toBe(1);
    expect(noteLineCount(48)).toBe(2);
    expect(noteLineCount(144)).toBe(6);
  });

  it("steps the radius from full to lg when it wraps", () => {
    expect(noteRadius(1)).toBe(radius.full);
    expect(noteRadius(2)).toBe(radius.lg);
  });

  it("formats the counter", () => {
    expect(noteCounter(84, 280)).toBe("84 / 280");
  });
});
