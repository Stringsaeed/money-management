import { render, screen } from "@testing-library/react-native";

import { HomeBrand } from "@/components/home/home-brand";

describe("HomeBrand", () => {
  it("renders the Trove brand mark", () => {
    render(<HomeBrand />);

    expect(screen.getByLabelText("Trove")).toBeOnTheScreen();
  });
});
