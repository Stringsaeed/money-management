import { defineRule } from "@oxlint/plugins";

const TEST_FILE = /\.test\.[cm]?[jt]sx?$/;
const TESTS_DIR = "__tests__";

export const requireTestsDirRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: `Require *.test.* files to live inside a ${TESTS_DIR} directory.`,
    },
    messages: {
      wrongLocation:
        'Test file "{{name}}" must live inside a "{{testsDir}}" directory, e.g. "{{expected}}".',
    },
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename.replaceAll("\\", "/");
        const segments = filename.split("/");
        const name = segments.pop() ?? filename;
        if (!TEST_FILE.test(name)) return;
        if (segments.includes(TESTS_DIR)) return;

        context.report({
          node,
          messageId: "wrongLocation",
          data: {
            name,
            testsDir: TESTS_DIR,
            expected: [...segments, TESTS_DIR, name].join("/"),
          },
        });
      },
    };
  },
});
