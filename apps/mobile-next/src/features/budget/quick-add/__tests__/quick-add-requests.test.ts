import { listenForQuickAdd, requestQuickAdd } from "../quick-add-requests";

describe("quick add requests", () => {
  it("reports false with no listener", () => {
    expect(requestQuickAdd()).toBe(false);
  });

  it("opens the latest listener and stops after it unsubscribes", () => {
    const first = jest.fn();
    const second = jest.fn();
    const stopFirst = listenForQuickAdd(first);
    const stopSecond = listenForQuickAdd(second);

    expect(requestQuickAdd()).toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    stopSecond();
    expect(requestQuickAdd()).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);

    stopFirst();
    expect(requestQuickAdd()).toBe(false);
  });
});
