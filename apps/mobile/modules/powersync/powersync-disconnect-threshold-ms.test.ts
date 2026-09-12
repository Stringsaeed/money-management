import { describe, expect, it } from "@jest/globals";

import { POWERSYNC_DISCONNECT_THRESHOLD_MS } from "./availability";

describe("POWERSYNC_DISCONNECT_THRESHOLD_MS", () => {
  it("locks the PowerSync disconnect threshold at ten minutes", () => {
    expect(POWERSYNC_DISCONNECT_THRESHOLD_MS).toBe(10 * 60_000);
  });
});
