import { eslintCompatPlugin } from "@oxlint/plugins";

import { noClassNamePropRule } from "./rules/no-classname-prop.ts";

const noClassNamePlugin = eslintCompatPlugin({
  meta: { name: "no-classname" },
  rules: {
    "no-classname-prop": noClassNamePropRule,
  },
});

export default noClassNamePlugin;
