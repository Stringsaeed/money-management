import { describe, expect, it } from "vitest";

import { POWERSYNC_JWT_ALGORITHM, importPowerSyncPrivateKey } from "./key";

describe("importPowerSyncPrivateKey", () => {
  it("rejects non-PEM material before jose import", async () => {
    await expect(importPowerSyncPrivateKey("not-a-pem")).rejects.toThrow(
      /PKCS#8 PEM/,
    );
    await expect(importPowerSyncPrivateKey("  ")).rejects.toThrow(/PKCS#8 PEM/);
  });

  it("exports ES256 as the PowerSync JWT algorithm", () => {
    expect(POWERSYNC_JWT_ALGORITHM).toBe("ES256");
  });
});
