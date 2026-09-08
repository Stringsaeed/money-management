import {
  ENABLE_SYNC_IDLE_DESCRIPTION,
  ENABLE_SYNC_MATCHED_DESCRIPTION,
  ENABLE_SYNC_MISMATCH_DESCRIPTION,
  ENABLE_SYNC_STATUS_LABEL,
} from "@/components/household/enable-sync-copy";

describe("Enable Sync product copy", () => {
  it("keeps the idle description concise and free of sharing/backup filler", () => {
    expect(ENABLE_SYNC_IDLE_DESCRIPTION).toBe(
      "Back up your data and keep it in sync across devices.",
    );
    expect(ENABLE_SYNC_IDLE_DESCRIPTION).not.toMatch(/Move your existing accounts/);
    expect(ENABLE_SYNC_IDLE_DESCRIPTION).not.toMatch(/ready to share/i);
    expect(ENABLE_SYNC_IDLE_DESCRIPTION).not.toMatch(/local data stays on this device as a backup/);
  });

  it("keeps the matched description about sync, not household sharing", () => {
    expect(ENABLE_SYNC_MATCHED_DESCRIPTION).toBe("Your data stays synced across devices.");
    expect(ENABLE_SYNC_MATCHED_DESCRIPTION).not.toMatch(/backs up automatically/);
    expect(ENABLE_SYNC_MATCHED_DESCRIPTION).not.toMatch(/shared with your household/);
    expect(ENABLE_SYNC_MATCHED_DESCRIPTION).not.toMatch(/ready to share/i);
  });

  it("states mismatch factually with a single next action", () => {
    expect(ENABLE_SYNC_MISMATCH_DESCRIPTION).toBe(
      "The upload didn't reconcile — your local data is unchanged. Try again.",
    );
    expect(ENABLE_SYNC_MISMATCH_DESCRIPTION).not.toMatch(/pre-import backup/);
  });

  it("keeps running and terminal status labels short", () => {
    expect(ENABLE_SYNC_STATUS_LABEL.uploading).toBe("Uploading your budget…");
    expect(ENABLE_SYNC_STATUS_LABEL.mismatched).toBe("Paused — data didn't reconcile");
    expect(ENABLE_SYNC_STATUS_LABEL.error).toBe("Something went wrong");
    expect(ENABLE_SYNC_STATUS_LABEL.matched).toBe("Synced ☁️");
  });
});
