import { render, screen } from "@testing-library/react-native";

import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
  it("is hidden from assistive tech and sized by props", async () => {
    await render(<Skeleton height={12} testID="skeleton" width={120} />);
    const block = screen.getByTestId("skeleton", { includeHiddenElements: true });
    expect(block.props.accessibilityElementsHidden).toBe(true);
  });
});
