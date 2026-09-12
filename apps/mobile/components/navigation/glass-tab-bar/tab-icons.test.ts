import { describe, expect, it } from "@jest/globals";
import {
  BookOpenIcon,
  ChartLineUpIcon,
  EnvelopeIcon,
  GearSixIcon,
  HouseIcon,
  TrayIcon,
} from "phosphor-react-native";

import { getTabIcon, hasTabIcon } from "./tab-icons";

describe("hasTabIcon", () => {
  it("returns true for known tab route names", () => {
    expect(hasTabIcon("(home)")).toBe(true);
    expect(hasTabIcon("ledger")).toBe(true);
    expect(hasTabIcon("money-movement")).toBe(true);
    expect(hasTabIcon("inbox")).toBe(true);
    expect(hasTabIcon("envelopes")).toBe(true);
    expect(hasTabIcon("settings")).toBe(true);
  });

  it("returns false for unknown route names", () => {
    expect(hasTabIcon("unknown")).toBe(false);
    expect(hasTabIcon("")).toBe(false);
    expect(hasTabIcon("home")).toBe(false);
  });
});

describe("getTabIcon", () => {
  it("returns the phosphor icon for each known tab route", () => {
    expect(getTabIcon("(home)")).toBe(HouseIcon);
    expect(getTabIcon("ledger")).toBe(BookOpenIcon);
    expect(getTabIcon("money-movement")).toBe(ChartLineUpIcon);
    expect(getTabIcon("inbox")).toBe(TrayIcon);
    expect(getTabIcon("envelopes")).toBe(EnvelopeIcon);
    expect(getTabIcon("settings")).toBe(GearSixIcon);
  });

  it("returns undefined for unknown route names", () => {
    expect(getTabIcon("unknown")).toBeUndefined();
    expect(getTabIcon("")).toBeUndefined();
    expect(getTabIcon("home")).toBeUndefined();
  });
});
