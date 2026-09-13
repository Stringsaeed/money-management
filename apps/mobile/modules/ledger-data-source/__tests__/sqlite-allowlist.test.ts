import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

import {
  formatSqliteRolesMarkdown,
  LEDGER_SQLITE_ALLOWLIST,
  type SqliteRoleEntry,
} from "../../../../../tools/oxlint/ledger-boundary/allowlist";

const REPO_ROOT = join(process.cwd(), "../..");

const resolveAllowlistedFile = (file: string): string =>
  isAbsolute(file) ? file : join(REPO_ROOT, file);

const hasGlob = (file: string): boolean => /[*?[]/.test(file);

describe("LEDGER_SQLITE_ALLOWLIST", () => {
  it("gives every entry a role, reason, issue, and at least one file", () => {
    expect(LEDGER_SQLITE_ALLOWLIST.length).toBeGreaterThan(0);
    for (const entry of LEDGER_SQLITE_ALLOWLIST) {
      expect(entry.role).toMatch(/^(authority-local|powersync-store|migration-backup|erase)$/);
      expect(entry.reason.trim().length).toBeGreaterThan(0);
      expect(entry.issue).toBeGreaterThan(0);
      expect(entry.files.length).toBeGreaterThan(0);
    }
  });

  it("lists concrete files that exist, not directory-wide budgeting globs", () => {
    const budgetingDirectoryGlob = LEDGER_SQLITE_ALLOWLIST.some((entry) =>
      entry.files.some((file) => file.includes("modules/budgeting/**")),
    );
    expect(budgetingDirectoryGlob).toBe(false);

    const missing: { role: SqliteRoleEntry["role"]; file: string }[] = [];
    for (const entry of LEDGER_SQLITE_ALLOWLIST) {
      for (const file of entry.files) {
        if (hasGlob(file)) continue;
        if (!existsSync(resolveAllowlistedFile(file))) {
          missing.push({ role: entry.role, file });
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("keeps docs/architecture/sqlite-roles.md identical to the allowlist", () => {
    const doc = readFileSync(join(REPO_ROOT, "docs/architecture/sqlite-roles.md"), "utf8");
    expect(doc).toBe(formatSqliteRolesMarkdown());
  });
});
