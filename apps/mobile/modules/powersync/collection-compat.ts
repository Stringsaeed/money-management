import { LogLevels, type PowerSyncLogger } from "@powersync/react-native";

export interface LegacyPowerSyncLogger extends PowerSyncLogger {
  readonly info: (message: string, error?: Error | string | null) => void;
  readonly warn: (message: string, error?: Error | string | null) => void;
  readonly error: (message: string, error?: Error | string | null) => void;
}

export const createLegacyPowerSyncLogger = (logger: PowerSyncLogger): LegacyPowerSyncLogger => {
  const writeRecord = logger.log.bind(logger);
  const write = (level: number, message: string, error?: Error | string | null) => {
    writeRecord({ level, message, error });
  };
  return {
    log: writeRecord,
    info: (message, error) => write(LogLevels.info, message, error),
    warn: (message, error) => write(LogLevels.warn, message, error),
    error: (message, error) => write(LogLevels.error, message, error),
  };
};

export const withLegacyPowerSyncLogger = <Database extends { readonly logger: PowerSyncLogger }>(
  database: Database,
): Database & { readonly logger: LegacyPowerSyncLogger } => {
  const logger = createLegacyPowerSyncLogger(database.logger);
  Object.assign(database.logger, logger);
  // SAFETY: Object.assign adds the three legacy methods to the existing PowerSync 2 logger while
  // preserving its structured log method; every other database member remains unchanged.
  return database as Database & { readonly logger: LegacyPowerSyncLogger };
};
