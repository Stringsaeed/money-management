import { render, screen } from "@testing-library/react-native";

import { SectionHeader } from "@/components/settings/section-header";

describe("SectionHeader", () => {
  it("keeps the default page spacing for top-level Settings sections", async () => {
    await render(<SectionHeader title="Manage 🛠️" />);

    const header = screen.getByTestId("section-header");
    expect(header.props.className).toContain("pt-8");
    expect(header.props.className).toContain("mx-5");
    expect(header.props.className).toContain("border-b");
  });

  it("drops the page-level top margin and outer margin for the in-card variant", async () => {
    await render(<SectionHeader title="Members 👥" variant="card" />);

    const header = screen.getByTestId("section-header");
    expect(header.props.className).not.toContain("pt-8");
    expect(header.props.className).not.toContain("mx-5");
    expect(header.props.className).toContain("px-4");
    expect(header.props.className).toContain("pt-4");
    expect(header.props.className).toContain("pb-3");
    expect(header.props.className).toContain("border-b");
  });

  it("renders the title text regardless of variant", async () => {
    await render(<SectionHeader title="Members 👥" variant="card" />);

    expect(screen.getByText("Members 👥")).toBeOnTheScreen();
  });
});
