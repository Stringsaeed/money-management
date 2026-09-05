export const leak = async (sqlite: {
  getAllAsync: (sql: string) => Promise<unknown>;
}): Promise<unknown> =>
  sqlite.getAllAsync("SELECT id, balance FROM accounts WHERE archived_at IS NULL");
