import { Pressable } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { CategoryTile } from "../category-tile";
import { ListGroup } from "../list-group";
import { ListRow } from "../list-row";
import { SectionHeader } from "../section-header";
import { TransactionRow } from "../transaction-row";

describe("TransactionRow", () => {
  it("fires onPress and speaks title, subtitle and amount", async () => {
    const onPress = jest.fn();
    await render(
      <TransactionRow
        currency="USD"
        icon="groceries"
        minor={-6420}
        onPress={onPress}
        subtitle="Groceries · 8:12 AM"
        title="Fresh Market"
      />,
    );
    const row = screen.getByRole("button");
    expect(row.props.accessibilityLabel).toMatch(/^Fresh Market, Groceries · 8:12 AM, .*64\.20/);
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows spending with a minus and money in with a plus", async () => {
    await render(
      <>
        <TransactionRow currency="USD" icon="groceries" minor={-6420} title="Spend" />
        <TransactionRow currency="USD" icon="salary" minor={420000} title="Pay" />
      </>,
    );
    expect(screen.getByLabelText(/^Spend, /)).toBeTruthy();
    expect(screen.getByLabelText(/^Pay, plus /)).toBeTruthy();
    expect(screen.getByText("−")).toBeTruthy();
    expect(screen.getByText("+")).toBeTruthy();
  });

  it("is not a button without onPress", async () => {
    await render(<TransactionRow currency="USD" icon="🍕" minor={-100} title="Slice" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("CategoryTile", () => {
  it("draws an emoji for user categories", async () => {
    await render(<CategoryTile icon="🍕" />);
    expect(screen.getByText("🍕", { includeHiddenElements: true })).toBeTruthy();
  });

  it("draws no emoji text for a Trove icon name", async () => {
    await render(<CategoryTile icon="groceries" tint="groceries" />);
    expect(screen.queryByText("groceries")).toBeNull();
  });
});

describe("ListRow and ListGroup", () => {
  it("presses, shows the value and the header/footer notes", async () => {
    const onPress = jest.fn();
    await render(
      <ListGroup footer="Used for new transactions." header="Preferences">
        <ListRow chevron icon="bank" onPress={onPress} title="Currency" value="USD" />
        <ListRow title="Lock with Face ID" trailing={<></>} />
      </ListGroup>,
    );
    expect(screen.getByText("Preferences")).toBeTruthy();
    expect(screen.getByText("Used for new transactions.")).toBeTruthy();
    expect(screen.getByText("USD")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps a trailing control reachable when the row itself is not pressable", async () => {
    const onToggle = jest.fn();
    await render(
      <ListRow
        title="Lock with Face ID"
        trailing={<SwitchStub label="Lock with Face ID" onToggle={onToggle} />}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Lock with Face ID"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders a destructive row as a button", async () => {
    const onPress = jest.fn();
    await render(<ListRow destructive icon="close" onPress={onPress} title="Sign out" />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("SectionHeader", () => {
  it("renders the day and its total", async () => {
    await render(<SectionHeader currency="USD" title="Yesterday" totalMinor={-12840} />);
    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByLabelText(/128\.40/)).toBeTruthy();
  });

  it("renders title only without a total", async () => {
    await render(<SectionHeader title="Today" />);
    expect(screen.getByText("Today")).toBeTruthy();
  });
});

function SwitchStub({ label, onToggle }: { label: string; onToggle: () => void }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="switch" onPress={onToggle} />;
}
