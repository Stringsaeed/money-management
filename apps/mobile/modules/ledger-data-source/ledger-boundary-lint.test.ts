import { execFileSync } from "node:child_process";
import { join } from "node:path";

const REPO_ROOT = join(process.cwd(), "../..");

describe("ledger-boundary oxlint fixtures", () => {
  it("fails closed on banned imports and raw entity SQL, and stays clean for type-only plus allowlisted files", () => {
    execFileSync("node", [join(REPO_ROOT, "tools/oxlint/ledger-boundary/run-fixture-lint.mjs")], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
  });
});
