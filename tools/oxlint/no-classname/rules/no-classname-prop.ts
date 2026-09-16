import { defineRule } from "@oxlint/plugins";

export const noClassNamePropRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow NativeWind className prop in JSX. Use theme module StyleSheet instead.",
    },
    messages: {
      noClassName:
        "NativeWind `className` is deprecated. Use the theme module StyleSheet approach instead. See issue #279 for the migration epic. To allow this file temporarily, add it to tools/oxlint/no-classname/allowlist.ts.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type === "JSXIdentifier" && node.name.name === "className") {
          context.report({
            node,
            messageId: "noClassName",
          });
        }
      },
    };
  },
});
