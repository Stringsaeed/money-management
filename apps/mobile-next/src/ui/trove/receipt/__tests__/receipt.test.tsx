import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text as NativeText } from "react-native";

import { colors } from "../../tokens";
import { DashedRule } from "../dashed-rule";
import { LeaderLine } from "../leader-line";
import { ReceiptCalc } from "../receipt-calc";
import { ReceiptNote } from "../receipt-note";
import { ReceiptSlip } from "../receipt-slip";
import { ReceiptStamp } from "../receipt-stamp";
import { ReceiptTear } from "../receipt-tear";
import { ReceiptTotal } from "../receipt-total";

const flatStyle = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

const rootElement = () => {
  const root = screen.root;
  if (!root) throw new Error("expected a rendered root");
  return root;
};

describe("ReceiptSlip", () => {
  it("is a link with its label when pressable", async () => {
    const onPress = jest.fn();
    await render(
      <ReceiptSlip accessibilityLabel="Bills: 2 of 4 paid" onPress={onPress}>
        <NativeText>BILLS</NativeText>
      </ReceiptSlip>,
    );
    const link = screen.getByRole("link", { name: "Bills: 2 of 4 paid" });
    await fireEvent.press(link);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is not pressable without onPress", async () => {
    await render(
      <ReceiptSlip>
        <NativeText>TOTAL</NativeText>
      </ReceiptSlip>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("TOTAL")).toBeTruthy();
  });
});

describe("ReceiptTear", () => {
  it("draws the measured edge once laid out, hidden from assistive tech", async () => {
    await render(<ReceiptTear depth={8} />);
    const root = screen.toJSON();
    if (!root || Array.isArray(root)) throw new Error("expected a single root node");
    expect(root.props.accessibilityElementsHidden).toBe(true);
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({ height: 8 });
    expect(JSON.stringify(root)).not.toContain("M0 0H");

    await fireEvent(rootElement(), "layout", {
      nativeEvent: { layout: { height: 8, width: 30, x: 0, y: 0 } },
    });
    expect(JSON.stringify(screen.toJSON())).toContain("M0 0H30V0L25 8L20 0");
  });
});

describe("DashedRule", () => {
  it("defaults to the paper rule at 1.5pt with Chrome's 4.5/4.5 dashes", async () => {
    await render(<DashedRule />);
    expect(JSON.stringify(screen.toJSON())).toContain('"strokeDasharray":["4.5","4.5"]');
    const root = screen.toJSON();
    if (!root || Array.isArray(root)) throw new Error("expected a single root node");
    expect(StyleSheet.flatten(root.props.style)).toMatchObject({ height: 1.5 });
  });
});

describe("LeaderLine", () => {
  it("speaks label and value as one line and hides the dotted leader", async () => {
    await render(<LeaderLine emoji="🏦" label="MONEY YOU HAVE" value="14,200" />);
    expect(screen.getByLabelText("MONEY YOU HAVE 14,200")).toBeTruthy();
    const leader = screen.getByText(/^·+$/, { includeHiddenElements: true });
    expect(leader.props.numberOfLines).toBe(1);
    expect(leader.props.ellipsizeMode).toBe("clip");
  });

  it("sets the value in Plex Mono 500 unless it follows the label weight", async () => {
    await render(
      <>
        <LeaderLine label="BILLS" value="4,675" />
        <LeaderLine
          label="EACH PAYDAY"
          marker
          value="AED 5,695"
          valueWeight="label"
          weight="bold"
        />
      </>,
    );
    expect(flatStyle("4,675").fontFamily).toBe("IBMPlexMono_500Medium");
    expect(flatStyle("AED 5,695")).toMatchObject({
      backgroundColor: colors.highlight,
      fontFamily: "IBMPlexMono_600SemiBold",
    });
  });

  it("prints the intro step number in the tertiary ink", async () => {
    await render(<LeaderLine gap={8} label="PAYDAY & MONEY" prefix="01" value="1 MIN" />);
    expect(flatStyle("01").color).toEqual(colors.paper.textTertiary);
  });
});

describe("ReceiptTotal", () => {
  it.each([
    ["ok", colors.highlight, colors.text.onPaper],
    ["warn", colors.paper.warningMarker, colors.paper.warning],
    ["neg", colors.paper.negativeMarker, colors.paper.negative],
  ] as const)("marks a %s total", async (tone, marker, ink) => {
    await render(<ReceiptTotal label="LEFT TO PLAN" tone={tone} value="AED 730" />);
    expect(screen.getByLabelText("LEFT TO PLAN AED 730")).toBeTruthy();
    expect(flatStyle("AED 730")).toMatchObject({ backgroundColor: marker, color: ink });
    expect(flatStyle("LEFT TO PLAN").color).toEqual(colors.text.onPaper);
  });

  it("tints the label too when asked", async () => {
    await render(<ReceiptTotal label="UNCOVERED" toneLabel tone="neg" value="40" />);
    expect(flatStyle("UNCOVERED").color).toEqual(colors.paper.negative);
  });
});

describe("ReceiptStamp and ReceiptNote", () => {
  it("prints the stamp tilted and the note centred", async () => {
    await render(
      <>
        <ReceiptStamp label="ON PLAN · 10 OF 11" />
        <ReceiptNote text="*** NO BANK CONNECTION NEEDED ***" />
      </>,
    );
    expect(screen.getByLabelText("ON PLAN · 10 OF 11")).toBeTruthy();
    expect(flatStyle("*** NO BANK CONNECTION NEEDED ***").textAlign).toBe("center");
  });
});

describe("ReceiptCalc", () => {
  it("prints the line, the toned total and an optional stamp", async () => {
    await render(
      <ReceiptCalc
        line={{ label: "EVERYDAY · OF 3,100", value: "2,980" }}
        stamp="ON PLAN · 10 OF 11"
        total={{ label: "UNCOVERED", tone: "neg", value: "40" }}
      />,
    );
    expect(screen.getByLabelText("EVERYDAY · OF 3,100 2,980")).toBeTruthy();
    expect(screen.getByLabelText("UNCOVERED 40")).toBeTruthy();
    expect(screen.getByText("ON PLAN · 10 OF 11")).toBeTruthy();
    expect(flatStyle("UNCOVERED").color).toEqual(colors.paper.negative);
  });

  it("leaves the stamp out when none is given", async () => {
    await render(
      <ReceiptCalc
        line={{ label: "PLANNED", value: "14,450" }}
        total={{ label: "OVER-PLANNED", tone: "warn", value: "AED 250" }}
      />,
    );
    expect(screen.queryByText(/ON PLAN/)).toBeNull();
  });
});
