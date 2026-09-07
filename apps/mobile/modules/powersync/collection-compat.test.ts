import { LogLevels, type LogRecord, type PowerSyncLogger } from "@powersync/react-native";

import { withLegacyPowerSyncLogger } from "./collection-compat";
import { powerSyncSchema } from "./schema";

describe("PowerSync 2 collection compatibility", () => {
  it("maps legacy logger methods to structured PowerSync records", () => {
    const records: LogRecord[] = [];
    const database = {
      marker: "bound",
      logger: { log: (record: LogRecord) => records.push(record) } satisfies PowerSyncLogger,
      readMarker() {
        return this.marker;
      },
    };

    const compatible = withLegacyPowerSyncLogger(database);
    const failure = new Error("boom");
    compatible.logger.info("ready");
    compatible.logger.warn("slow");
    compatible.logger.error("failed", failure);

    expect(records).toEqual([
      { level: LogLevels.info, message: "ready", error: undefined },
      { level: LogLevels.warn, message: "slow", error: undefined },
      { level: LogLevels.error, message: "failed", error: failure },
    ]);
    expect(compatible.readMarker()).toBe("bound");
  });

  it("uses the named table copies resolved by the PowerSync 2 schema", () => {
    expect(powerSyncSchema.props.accounts.viewName).toBe("accounts");
    expect(powerSyncSchema.props.recurring_rules.viewName).toBe("recurring_rules");
    expect(powerSyncSchema.props.rejected_changes.viewName).toBe("rejected_changes");
  });
});
