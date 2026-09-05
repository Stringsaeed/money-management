import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const config = join(here, "oxlint.fixture.config.ts");

const lint = (fixturePath) => {
  const absolute = join(here, fixturePath);
  try {
    return execFileSync("pnpm", ["exec", "oxlint", "-c", config, "--format", "json", absolute], {
      cwd: repoRoot,
      encoding: "utf8",
    });
  } catch (error) {
    if (error && typeof error.stdout === "string" && error.stdout.trim()) return error.stdout;
    throw error;
  }
};

const codes = (stdout) => {
  const report = JSON.parse(stdout || "{}");
  return (report.diagnostics ?? []).map((diagnostic) => diagnostic.code ?? "").join("\n");
};

const expectMatch = (fixturePath, pattern) => {
  const found = codes(lint(fixturePath));
  if (!pattern.test(found)) {
    throw new Error(`${fixturePath} expected ${pattern} in:\n${found || "<clean>"}`);
  }
};

const expectClean = (fixturePath) => {
  const found = codes(lint(fixturePath));
  if (found) throw new Error(`${fixturePath} expected a clean report, got:\n${found}`);
};

expectMatch("fixtures/bad-import.ts", /no-restricted-imports/);
expectMatch("fixtures/bad-sql.ts", /no-raw-entity-sql/);
expectClean("fixtures/type-only.ts");
expectClean("fixtures/allowed/local-port.ts");

console.log("ledger-boundary fixtures passed");
