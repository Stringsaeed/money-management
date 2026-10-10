import { fireEvent, render, screen } from "@testing-library/react-native";

import { Avatar } from "../avatar";
import { avatarAccessibilityLabel, initialsFor } from "../utils";

describe("Avatar", () => {
  it("shows initials and is labelled by them by default", async () => {
    await render(<Avatar initials="AB" />);
    expect(screen.getByText("AB")).toBeTruthy();
    expect(screen.getByLabelText("AB")).toBeTruthy();
  });

  it("shows the emoji instead of initials", async () => {
    await render(<Avatar emoji="🦊" initials="AB" size={64} />);
    expect(screen.getByText("🦊")).toBeTruthy();
    expect(screen.queryByText("AB")).toBeNull();
  });

  it("marks the household scope in its accessible name", async () => {
    await render(<Avatar accessibilityLabel="Profile" initials="AB" scope="household" />);
    expect(screen.getByLabelText("Profile, household")).toBeTruthy();
  });

  it("becomes a button when given onPress", async () => {
    const onPress = jest.fn();
    await render(<Avatar accessibilityLabel="Profile" initials="AB" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Profile" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("avatar helpers", () => {
  it("derives up to two uppercase initials", () => {
    expect(initialsFor("ada byron")).toBe("AB");
    expect(initialsFor("  Ada  ")).toBe("A");
    expect(initialsFor("Ada Maria Byron")).toBe("AB");
    expect(initialsFor("")).toBe("");
  });

  it("falls back to a generic label", () => {
    expect(avatarAccessibilityLabel(undefined, undefined, "personal")).toBe("Avatar");
    expect(avatarAccessibilityLabel(undefined, "AB", "household")).toBe("AB, household");
  });
});
