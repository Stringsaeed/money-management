const revokedLedgerIds = new Set<string>();

export const markPowerSyncLedgerRevoked = (ledgerId: string): void => {
  revokedLedgerIds.add(ledgerId);
};

export const restorePowerSyncLedgerAccess = (ledgerId: string): void => {
  revokedLedgerIds.delete(ledgerId);
};

export const isPowerSyncLedgerRevoked = (ledgerId: string): boolean =>
  revokedLedgerIds.has(ledgerId);
