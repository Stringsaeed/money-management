import { countValue, isCurrentRule, isUnarchived } from "../settings-counts";

const query = <T>(data: T[], state: { isLoading?: boolean; isError?: boolean } = {}) => ({
  data,
  isLoading: state.isLoading ?? false,
  isError: state.isError ?? false,
});

describe("countValue", () => {
  it("counts the rows the list screen shows by default", () => {
    const accounts = [{ archived: false }, { archived: true }, { archived: false }];
    expect(countValue(query(accounts), isUnarchived)).toBe("2");
    const rules = [{ lifecycle: "active" }, { lifecycle: "paused" }, { lifecycle: "archived" }];
    expect(countValue(query(rules), isCurrentRule)).toBe("2");
  });

  it("shows zero for an empty ledger", () => {
    expect(countValue(query<{ archived: boolean }>([]), isUnarchived)).toBe("0");
  });

  it("shows nothing while loading or after an error", () => {
    expect(countValue(query([{ archived: false }], { isLoading: true }), isUnarchived)).toBe(
      undefined,
    );
    expect(countValue(query([{ archived: false }], { isError: true }), isUnarchived)).toBe(
      undefined,
    );
  });
});
