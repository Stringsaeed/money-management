import { renderHook } from "@testing-library/react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

const mockUseColorScheme = jest.fn();

jest.mock("@/hooks/use-color-scheme", () => ({
  useColorScheme: () => mockUseColorScheme(),
}));

describe("useThemeColor", () => {
  it("prefers an explicit light or dark override", () => {
    mockUseColorScheme.mockReturnValue("dark");

    const { result } = renderHook(() =>
      useThemeColor({ light: "#fff", dark: "#111" }, "background"),
    );

    expect(result.current).toBe("#111");
  });

  it("falls back to the theme palette when no override is provided", () => {
    mockUseColorScheme.mockReturnValue(undefined);

    const { result } = renderHook(() => useThemeColor({}, "text"));

    expect(result.current).toBeDefined();
  });
});
