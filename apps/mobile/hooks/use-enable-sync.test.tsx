import { act, waitFor } from "@testing-library/react-native";

import { useEnableSync, useMigratedHouseholdId } from "@/hooks/use-enable-sync";
import { useSyncModeStore } from "@/stores/sync-mode-store";
import { renderHookWithProviders } from "@/tests/test-utils/render";

const FAKE_DB = { __fakeDb: true };
const FAKE_SQLITE = { __fakeSqlite: true };

jest.mock("@/db/client", () => ({
  useDatabase: () => FAKE_DB,
}));

jest.mock("@/db/sqlite", () => ({
  useSQLiteContext: () => FAKE_SQLITE,
}));

const mockBackupLocalDatabase = jest.fn();
jest.mock("@/lib/migration/backup", () => ({
  backupLocalDatabase: (...args: unknown[]) => mockBackupLocalDatabase(...args),
}));

const mockRunImport = jest.fn();
jest.mock("@/lib/migration/enable-sync", () => ({
  runImport: (...args: unknown[]) => mockRunImport(...args),
}));

const mockMarkMigrationCompleted = jest.fn();
const mockGetMigratedHouseholdId = jest.fn();
jest.mock("@/lib/migration/status", () => ({
  markMigrationCompleted: (...args: unknown[]) => mockMarkMigrationCompleted(...args),
  getMigratedHouseholdId: (...args: unknown[]) => mockGetMigratedHouseholdId(...args),
}));

const mockTruncateOutbox = jest.fn();
jest.mock("@/lib/sync/outbox", () => ({
  truncateOutbox: (...args: unknown[]) => mockTruncateOutbox(...args),
}));

jest.mock("@/modules/powersync/database", () => ({
  connectPowerSync: jest.fn(),
}));

const mockHouseholdsCreate = jest.fn();
const mockCommandsApply = jest.fn();
const mockGetManifest = jest.fn();
const mockGetDelta = jest.fn();
jest.mock("@/lib/server/orpc", () => ({
  orpc: {
    households: { create: (...args: unknown[]) => mockHouseholdsCreate(...args) },
    commands: { apply: (...args: unknown[]) => mockCommandsApply(...args) },
    migration: { getManifest: (...args: unknown[]) => mockGetManifest(...args) },
    sync: { getDelta: (...args: unknown[]) => mockGetDelta(...args) },
  },
}));

const MATCHED_RESULT = { status: "matched" as const, localManifest: {}, serverManifest: {} };

beforeEach(() => {
  jest.clearAllMocks();
  mockBackupLocalDatabase.mockResolvedValue("file:///backup.db");
  mockTruncateOutbox.mockResolvedValue(undefined);
  mockMarkMigrationCompleted.mockResolvedValue(undefined);
  useSyncModeStore.setState({ mode: "local_only", reason: "delta_unavailable" });
});

describe("useEnableSync", () => {
  it("creates a household, backs up, uploads, and flips to synced mode on a match", async () => {
    mockHouseholdsCreate.mockResolvedValue({ householdId: "household-new" });
    mockRunImport.mockResolvedValue(MATCHED_RESULT);

    const { result } = await renderHookWithProviders(() => useEnableSync());
    await act(async () => {
      await result.current.enableSync({ householdName: "The Saeeds" });
    });

    expect(mockHouseholdsCreate).toHaveBeenCalledWith({ name: "The Saeeds" });
    expect(mockBackupLocalDatabase).toHaveBeenCalledWith(FAKE_SQLITE);
    expect(mockRunImport).toHaveBeenCalledWith(
      expect.objectContaining({ db: FAKE_DB, householdId: "household-new" }),
    );
    expect(mockTruncateOutbox).toHaveBeenCalledWith(FAKE_DB, "household-new");
    expect(mockMarkMigrationCompleted).toHaveBeenCalledWith(FAKE_DB, "household-new");
    await waitFor(() => expect(result.current.status).toBe("matched"));
    expect(useSyncModeStore.getState().mode).toBe("synced");
  });

  it("reuses an already-created household instead of calling households.create", async () => {
    mockRunImport.mockResolvedValue(MATCHED_RESULT);

    const { result } = await renderHookWithProviders(() => useEnableSync());
    await act(async () => {
      await result.current.enableSync({ householdId: "household-existing" });
    });

    expect(mockHouseholdsCreate).not.toHaveBeenCalled();
    expect(mockRunImport).toHaveBeenCalledWith(
      expect.objectContaining({ householdId: "household-existing" }),
    );
    await waitFor(() => expect(result.current.status).toBe("matched"));
  });

  it("surfaces a rejected chunk as an error without truncating the outbox or flipping sync mode", async () => {
    mockHouseholdsCreate.mockResolvedValue({ householdId: "household-new" });
    mockRunImport.mockResolvedValue({
      status: "rejected",
      entityType: "transaction",
      chunkIndex: 2,
      result: { kind: "forbidden", role: "member", requiredCapability: "x" },
    });

    const { result } = await renderHookWithProviders(() => useEnableSync());
    await act(async () => {
      await result.current.enableSync({ householdName: "Test" });
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error?.message).toContain("transaction");
    expect(mockTruncateOutbox).not.toHaveBeenCalled();
    expect(mockMarkMigrationCompleted).not.toHaveBeenCalled();
    expect(useSyncModeStore.getState().mode).toBe("local_only");
  });

  it("pauses on a manifest mismatch, keeping the backup and local-only mode", async () => {
    mockHouseholdsCreate.mockResolvedValue({ householdId: "household-new" });
    const localManifest = { rowCounts: { account: 1 } };
    const serverManifest = { rowCounts: { account: 0 } };
    mockRunImport.mockResolvedValue({ status: "mismatched", localManifest, serverManifest });

    const { result } = await renderHookWithProviders(() => useEnableSync());
    await act(async () => {
      await result.current.enableSync({ householdName: "Test" });
    });

    await waitFor(() => expect(result.current.status).toBe("mismatched"));
    expect(result.current.discrepancy).toEqual({ localManifest, serverManifest });
    expect(mockTruncateOutbox).not.toHaveBeenCalled();
    expect(mockMarkMigrationCompleted).not.toHaveBeenCalled();
    expect(useSyncModeStore.getState().mode).toBe("local_only");
  });
});

describe("useMigratedHouseholdId", () => {
  it("reads the persisted migration flag", async () => {
    mockGetMigratedHouseholdId.mockResolvedValue("household-done");
    const { result } = await renderHookWithProviders(() => useMigratedHouseholdId());
    await waitFor(() => expect(result.current.data).toBe("household-done"));
  });
});
