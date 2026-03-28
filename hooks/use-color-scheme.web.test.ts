import { renderHook, waitFor } from "@testing-library/react-native";

import { useColorScheme } from "@/hooks/use-color-scheme.web";

const mockUseColorScheme = jest.fn();

jest.mock("react-native", () => {
  return {
    useColorScheme: () => mockUseColorScheme(),
  };
});

describe("useColorScheme.web", () => {
  it("returns the native scheme after hydration", async () => {
    mockUseColorScheme.mockReturnValue("dark");

    const { result } = renderHook(() => useColorScheme());

    await waitFor(() => {
      expect(result.current).toBe("dark");
    });
  });
});
