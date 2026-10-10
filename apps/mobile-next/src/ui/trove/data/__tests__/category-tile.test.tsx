import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { iconPath } from "../../icon/icon-paths";
import { CategoryTile } from "../category-tile";

const tileStyle = () => {
  const root = screen.toJSON();
  if (!root || Array.isArray(root)) throw new Error("expected a single root node");
  return StyleSheet.flatten(root.props.style);
};

describe("CategoryTile kinds", () => {
  it.each(["income", "expense", "transfer"] as const)("draws the %s stroke icon", async (kind) => {
    await render(<CategoryTile kind={kind} />);
    expect(JSON.stringify(screen.toJSON())).toContain(iconPath(`kind-${kind}`, false));
    expect(screen.queryByText(kind)).toBeNull();
  });

  it("is round and ignores icon, color and tint when a kind is set", async () => {
    await render(<CategoryTile color="#3E4CF0" icon="🍕" kind="expense" tint="dining" />);
    expect(screen.queryByText("🍕", { includeHiddenElements: true })).toBeNull();
    expect(tileStyle().borderRadius).toBe(999);
  });

  it("stays decorative", async () => {
    await render(<CategoryTile kind="income" />);
    expect(screen.queryByRole("image")).toBeNull();
    expect(screen.toJSON()).toMatchObject({ props: { accessibilityElementsHidden: true } });
  });
});

describe("CategoryTile user colour", () => {
  it("tints a round tile at 18% and keeps the emoji", async () => {
    await render(<CategoryTile color="#3E4CF0" icon="🛒" />);
    expect(screen.getByText("🛒", { includeHiddenElements: true })).toBeTruthy();
    expect(tileStyle()).toMatchObject({ backgroundColor: "#3E4CF02E", borderRadius: 999 });
  });

  it("keeps the 8pt square tile without kind or color", async () => {
    await render(<CategoryTile icon="🍕" />);
    expect(tileStyle().borderRadius).toBe(8);
  });
});
