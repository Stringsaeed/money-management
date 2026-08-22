import { act, renderHook } from "@testing-library/react-native";

import useNumPadNumber from "@/hooks/use-num-pad-number";

describe("useNumPadNumber", () => {
  it("appends digits and replaces the default zero", async () => {
    const { result } = await renderHook(() => useNumPadNumber());

    await act(() => {
      result.current.appendDigit(undefined as never);
      result.current.appendDigit(4);
      result.current.appendDigit(2);
    });

    expect(result.current.displayValue).toBe("42");
    expect(result.current.value).toBe(42);
  });

  it("supports decimals and limits decimal places to two", async () => {
    const { result } = await renderHook(() => useNumPadNumber());

    await act(() => {
      result.current.appendDigit(1);
      result.current.addDecimalPoint();
      result.current.appendDigit(2);
      result.current.appendDigit(3);
      result.current.appendDigit(4);
    });

    expect(result.current.displayValue).toBe("1.23");
    expect(result.current.value).toBe(1.23);
    expect(result.current.decimalPlaces).toBe(2);
  });

  it("keeps leading zeroes collapsed and ignores repeated decimal points", async () => {
    const { result } = await renderHook(() => useNumPadNumber());

    await act(() => {
      result.current.appendDigit(0);
      result.current.appendDigit(0);
      result.current.addDecimalPoint();
      result.current.addDecimalPoint();
      result.current.appendDigit(5);
    });

    expect(result.current.displayValue).toBe("0.5");
    expect(result.current.isDecimal).toBe(true);
  });

  it("deletes digits and clears back to zero", async () => {
    const { result } = await renderHook(() => useNumPadNumber(12.3));

    await act(() => {
      result.current.deleteDigit();
      result.current.deleteDigit();
      result.current.deleteDigit();
      result.current.deleteDigit();
      result.current.deleteDigit();
    });

    expect(result.current.displayValue).toBe("0");
    expect(result.current.value).toBe(0);
    expect(result.current.isDecimal).toBe(false);
  });

  it("removes the decimal marker cleanly when deleting", async () => {
    const { result } = await renderHook(() => useNumPadNumber());

    await act(() => {
      result.current.appendDigit(1);
      result.current.addDecimalPoint();
      result.current.deleteDigit();
    });

    expect(result.current.displayValue).toBe("1");
    expect(result.current.isDecimal).toBe(false);
    expect(result.current.decimalPlaces).toBe(0);
  });

  it("enforces the max digit length", async () => {
    const { result } = await renderHook(() => useNumPadNumber());

    await act(() => {
      "123456789012345".split("").forEach((digit) => {
        result.current.appendDigit(Number(digit));
      });
    });

    expect(result.current.displayValue.replace(/,/g, "")).toHaveLength(13);
  });

  it("clears all state", async () => {
    const { result } = await renderHook(() => useNumPadNumber(123.45));

    await act(() => {
      result.current.clearAll();
    });

    expect(result.current.displayValue).toBe("0");
    expect(result.current.value).toBe(0);
    expect(result.current.decimalPlaces).toBe(0);
  });

  it("formats large initial values with commas", async () => {
    const { result } = await renderHook(() => useNumPadNumber(12345));

    expect(result.current.displayValue).toBe("12,345");
  });
});
