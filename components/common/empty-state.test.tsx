import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { EmptyState } from "@/components/common/empty-state";

describe("EmptyState", () => {
  it("renders icon, title, message, and action content", () => {
    render(
      <EmptyState
        icon="📋"
        title="No data"
        message="Nothing to show"
        action={<Text>Take action</Text>}
      />,
    );

    expect(screen.getByText("📋")).toBeOnTheScreen();
    expect(screen.getByText("No data")).toBeOnTheScreen();
    expect(screen.getByText("Nothing to show")).toBeOnTheScreen();
    expect(screen.getByText("Take action")).toBeOnTheScreen();
  });
});
