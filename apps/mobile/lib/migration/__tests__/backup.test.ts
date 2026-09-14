import { backupLocalDatabase } from "../backup";

const mockDelete = jest.fn();
const mockCopy = jest.fn().mockResolvedValue(undefined);
let mockNextFileExists = false;

jest.mock("expo-file-system", () => {
  class MockFile {
    uri: string;
    exists: boolean;
    constructor(_parent: unknown, name: string) {
      this.uri = `file:///documents/SQLite/${name}`;
      this.exists = mockNextFileExists;
    }
    delete() {
      mockDelete();
    }
    copy(destination: unknown) {
      return mockCopy(destination);
    }
  }
  return { File: MockFile, Directory: class {}, Paths: { document: {} } };
});

const mockExecAsync = jest.fn().mockResolvedValue(undefined);
const sqlite = {
  execAsync: (...args: unknown[]) => mockExecAsync(...args),
} as unknown as Parameters<typeof backupLocalDatabase>[0];

beforeEach(() => {
  jest.clearAllMocks();
  mockNextFileExists = false;
});

describe("backupLocalDatabase", () => {
  it("checkpoints the WAL before copying the main file", async () => {
    await backupLocalDatabase(sqlite);
    expect(mockExecAsync).toHaveBeenCalledWith("PRAGMA wal_checkpoint(TRUNCATE);");
    expect(mockCopy).toHaveBeenCalledTimes(1);
  });

  it("returns the backup file's uri", async () => {
    const uri = await backupLocalDatabase(sqlite);
    expect(uri).toBe("file:///documents/SQLite/money.db.backup");
  });

  it("deletes a stale backup from a previous run before copying, for idempotent retries", async () => {
    mockNextFileExists = true;
    await backupLocalDatabase(sqlite);
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockCopy).toHaveBeenCalledTimes(1);
  });

  it("never deletes when no prior backup exists", async () => {
    mockNextFileExists = false;
    await backupLocalDatabase(sqlite);
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
