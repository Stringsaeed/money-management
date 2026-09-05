import { defineConfig } from "oxlint";

import { LEDGER_RESTRICTED_IMPORTS } from "./allowlist.ts";

export default defineConfig({
  jsPlugins: [
    {
      name: "ledger-boundary",
      specifier: "./index.ts",
    },
  ],
  rules: {
    "no-restricted-imports": ["error", LEDGER_RESTRICTED_IMPORTS],
    "ledger-boundary/no-raw-entity-sql": "error",
  },
  overrides: [
    {
      files: ["**/fixtures/allowed/**", "fixtures/allowed/**"],
      rules: {
        "no-restricted-imports": "off",
        "ledger-boundary/no-raw-entity-sql": "off",
      },
    },
  ],
});
