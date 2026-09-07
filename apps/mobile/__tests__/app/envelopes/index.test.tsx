import EnvelopesScreen from "@/app/(tabs)/envelopes";
import { BudgetWorkspaceScreen } from "@/components/envelopes/budget-workspace-screen";

describe("app/(tabs)/envelopes/index", () => {
  it("mounts the live currency workspace", () => {
    expect(EnvelopesScreen).toBe(BudgetWorkspaceScreen);
  });
});
