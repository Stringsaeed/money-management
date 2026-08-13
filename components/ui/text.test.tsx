import { render, screen } from "@testing-library/react-native";

import { Text } from "@/components/ui/text";

describe("Text", () => {
  it("renders heading semantics", async () => {
    await render(<Text variant="h2">Heading</Text>);

    expect(screen.getByRole("heading", { name: "Heading" })).toBeOnTheScreen();
  });
});
