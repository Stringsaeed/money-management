import Database from "better-sqlite3";
import { startPowerSyncWorker } from "@powersync/node/worker.js";

startPowerSyncWorker({
  loadBetterSqlite3: async () => Database,
});
