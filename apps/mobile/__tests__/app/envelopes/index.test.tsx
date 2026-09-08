import type { ReactNode } from "react";

import EnvelopesScreen from "@/app/(tabs)/envelopes";
import { BudgetWorkspaceScreen } from "@/components/envelopes/budget-workspace-screen";

jest.mock("expo-router", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  return {
    Link: ({ children }: { children: ReactNode }) =>
      React.isValidElement(children) ? React.cloneElement(children) : children,
  };
});

describe("app/(tabs)/envelopes/index", () => {
  it("mounts the live currency workspace", () => {
    expect(EnvelopesScreen).toBe(BudgetWorkspaceScreen);
  });
});
