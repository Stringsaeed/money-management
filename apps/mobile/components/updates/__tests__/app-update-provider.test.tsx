import { act, renderHook, waitFor } from "@testing-library/react-native";

import { AppUpdateProvider } from "../app-update-provider";
import { useAppUpdate } from "@/hooks/use-app-update";

const mockCheckForUpdateAsync = jest.fn();
const mockFetchUpdateAsync = jest.fn();
const mockReloadAsync = jest.fn();
const mockUseUpdates = jest.fn();
let mockIsEnabled = true;

jest.mock("expo-updates", () => ({
  get isEnabled() {
    return mockIsEnabled;
  },
  checkForUpdateAsync: (...args: unknown[]) => mockCheckForUpdateAsync(...args),
  fetchUpdateAsync: (...args: unknown[]) => mockFetchUpdateAsync(...args),
  reloadAsync: (...args: unknown[]) => mockReloadAsync(...args),
  useUpdates: () => mockUseUpdates(),
}));

const noUpdateResult = {
  isAvailable: false,
  isRollBackToEmbedded: false,
  manifest: undefined,
  reason: "noUpdateAvailableOnServer",
};

const optionalUpdateResult = {
  isAvailable: true,
  isRollBackToEmbedded: false,
  manifest: { extra: { expoClient: { extra: { ota: { mandatory: false } } } } },
  reason: undefined,
};

const mandatoryUpdateResult = {
  isAvailable: true,
  isRollBackToEmbedded: false,
  manifest: { extra: { expoClient: { extra: { ota: { mandatory: true } } } } },
  reason: undefined,
};

describe("AppUpdateProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEnabled = true;
    delete process.env.EXPO_OS;
    mockUseUpdates.mockReturnValue({
      downloadProgress: 0,
      isUpdatePending: false,
    });
    mockCheckForUpdateAsync.mockResolvedValue(noUpdateResult);
    mockFetchUpdateAsync.mockResolvedValue({
      isNew: true,
      isRollBackToEmbedded: false,
      manifest: optionalUpdateResult.manifest,
    });
    mockReloadAsync.mockResolvedValue(undefined);
  });

  it("stays disabled and skips the launch check when updates are unavailable", async () => {
    mockIsEnabled = false;

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    expect(result.current.status).toBe("disabled");
    await waitFor(() => {
      expect(mockCheckForUpdateAsync).not.toHaveBeenCalled();
    });
  });

  it("reports the app as current when the launch check finds no update", async () => {
    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    await waitFor(() => {
      expect(result.current.status).toBe("current");
    });
    expect(result.current.isMandatory).toBe(false);
    expect(mockCheckForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it("exposes an optional update without downloading it", async () => {
    mockCheckForUpdateAsync.mockResolvedValue(optionalUpdateResult);

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    await waitFor(() => {
      expect(result.current.status).toBe("available");
    });
    expect(result.current.isMandatory).toBe(false);
    expect(mockFetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockReloadAsync).not.toHaveBeenCalled();
  });

  it("downloads and reloads immediately for a mandatory update", async () => {
    mockCheckForUpdateAsync.mockResolvedValue(mandatoryUpdateResult);

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    await waitFor(() => {
      expect(result.current.status).toBe("restarting");
    });
    expect(result.current.isMandatory).toBe(true);
    expect(mockFetchUpdateAsync).toHaveBeenCalledTimes(1);
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  it("deduplicates checks while an update operation is in flight", async () => {
    let resolveCheck!: (value: typeof noUpdateResult) => void;
    mockCheckForUpdateAsync.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    await waitFor(() => {
      expect(mockCheckForUpdateAsync).toHaveBeenCalledTimes(1);
    });

    let firstCheck!: Promise<void>;
    let secondCheck!: Promise<void>;
    await act(() => {
      firstCheck = result.current.checkForUpdate();
      secondCheck = result.current.checkForUpdate();
    });

    expect(firstCheck).toBe(secondCheck);
    expect(mockCheckForUpdateAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCheck(noUpdateResult);
      await firstCheck;
    });
    expect(result.current.status).toBe("current");
  });

  it("surfaces a launch check failure with recovery guidance", async () => {
    mockCheckForUpdateAsync.mockRejectedValue(new Error("offline"));

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBe("Check your connection and try again. (offline)");
  });

  it("surfaces a download failure without reloading", async () => {
    mockCheckForUpdateAsync.mockResolvedValue(optionalUpdateResult);
    mockFetchUpdateAsync.mockRejectedValue(new Error("download interrupted"));

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });
    await waitFor(() => {
      expect(result.current.status).toBe("available");
    });

    await act(async () => {
      await result.current.installUpdate();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(
      "Keep the app open, check your connection, and try again. (download interrupted)",
    );
    expect(mockReloadAsync).not.toHaveBeenCalled();
  });

  it("reloads an already pending update without fetching it again", async () => {
    mockUseUpdates.mockReturnValue({
      downloadProgress: 1,
      isUpdatePending: true,
    });
    mockCheckForUpdateAsync.mockResolvedValue(optionalUpdateResult);

    const { result } = await renderHook(() => useAppUpdate(), { wrapper: AppUpdateProvider });
    await waitFor(() => {
      expect(result.current.status).toBe("available");
    });

    await act(async () => {
      await result.current.installUpdate();
    });

    expect(result.current.status).toBe("restarting");
    expect(mockFetchUpdateAsync).not.toHaveBeenCalled();
    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });
});
