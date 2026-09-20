export type ClassNameAllowlistEntry = {
  files: string[];
  reason: string;
  issue: number;
};

export const CLASSNAME_MIGRATION_MESSAGE =
  "NativeWind `className` is deprecated in favor of the theme module's StyleSheet approach. See issue #279 for the migration epic. If this file must use className temporarily, add it to tools/oxlint/no-classname/allowlist.ts with a reason.";

export const CLASSNAME_ALLOWLIST: ClassNameAllowlistEntry[] = [];

export type OxlintOverride = {
  files: string[];
  rules: Record<string, unknown>;
};

export function classNameAllowlistOverrides(): OxlintOverride[] {
  return CLASSNAME_ALLOWLIST.map((entry) => ({
    files: entry.files,
    rules: {
      "no-classname/no-classname-prop": "off",
    },
  }));
}

export function allowlistFilePaths(): string[] {
  return CLASSNAME_ALLOWLIST.flatMap((entry) => entry.files);
}
