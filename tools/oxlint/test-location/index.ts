import { eslintCompatPlugin } from "@oxlint/plugins";

import { requireTestsDirRule } from "./rules/require-tests-dir.ts";

const testLocationPlugin = eslintCompatPlugin({
  meta: { name: "test-location" },
  rules: {
    "require-tests-dir": requireTestsDirRule,
  },
});

export default testLocationPlugin;
