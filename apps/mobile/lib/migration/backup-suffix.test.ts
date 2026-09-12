import { describe, expect, it } from "@jest/globals";

jest.mock("expo-file-system", () => ({
  File: class {},
  Directory: class {},
  Paths: { document: {} },
}));

import { BACKUP_SUFFIX } from "./backup";

describe("BACKUP_SUFFIX", () => {
  it('locks pre-import backup suffix to ".backup"', () => {
    expect(BACKUP_SUFFIX).toBe(".backup");
  });
});
