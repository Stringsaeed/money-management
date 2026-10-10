import { renderHook } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { useUserColor } from "../use-user-color";

describe("useUserColor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses the 18% tint on paper", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");
    const { result } = await renderHook(() => useUserColor("#EB6834"));
    expect(result.current).toEqual({ tint: "#EB68342E", ring: "#EB6834" });
  });

  it("uses the 25% tint on dark", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const { result } = await renderHook(() => useUserColor("#EB6834"));
    expect(result.current).toEqual({ tint: "#EB683440", ring: "#EB6834" });
  });

  it("is null without a valid colour", async () => {
    const { result } = await renderHook(() => useUserColor(undefined));
    expect(result.current).toBeNull();
  });
});
