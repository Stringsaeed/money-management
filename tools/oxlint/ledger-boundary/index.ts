import { eslintCompatPlugin } from "@oxlint/plugins";

import { noRawEntitySqlRule } from "./rules/no-raw-entity-sql.ts";

const ledgerBoundaryPlugin = eslintCompatPlugin({
  meta: { name: "ledger-boundary" },
  rules: {
    "no-raw-entity-sql": noRawEntitySqlRule,
  },
});

export default ledgerBoundaryPlugin;
