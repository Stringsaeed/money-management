import { render, screen } from "@testing-library/react-native";

import { SectionHeader } from "@/components/settings/section-header";
import { spacing } from "@/lib/design-tokens";

describe("SectionHeader", () => {
  it("keeps the default page spacing for top-level Settings sections", async () => {
    await render(<SectionHeader title="Manage 🛠️" />);

    const header = screen.getByTestId("section-header");
    const flatStyle = Array.isArray(header.props.style)
      ? Object.assign({}, ...header.props.style)
      : header.props.style;
    expect(flatStyle.paddingTop).toBe(spacing[8]);
    expect(flatStyle.marginHorizontal).toBe(spacing[5]);
    expect(flatStyle.borderBottomWidth).toBeDefined();
  });

  it("drops the page-level top margin and outer margin for the in-card variant", async () => {
    await render(<SectionHeader title="Members 👥" variant="card" />);

    const header = screen.getByTestId("section-header");
    const flatStyle = Array.isArray(header.props.style)
      ? Object.assign({}, ...header.props.style)
      : header.props.style;
    expect(flatStyle.paddingTop).toBe(spacing[4]);
    expect(flatStyle.paddingHorizontal).toBe(spacing[4]);
    expect(flatStyle.paddingBottom).toBe(spacing[3]);
    expect(flatStyle.borderBottomWidth).toBeDefined();
    expect(flatStyle.marginHorizontal).toBeUndefined();
  });

  it("renders the title text regardless of variant", async () => {
    await render(<SectionHeader title="Members 👥" variant="card" />);

    expect(screen.getByText("Members 👥")).toBeOnTheScreen();
  });
});
