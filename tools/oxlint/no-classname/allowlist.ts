export type ClassNameAllowlistEntry = {
  files: string[];
  reason: string;
  issue: number;
};

export const CLASSNAME_MIGRATION_MESSAGE =
  "NativeWind `className` is deprecated in favor of the theme module's StyleSheet approach. See issue #279 for the migration epic. If this file must use className temporarily, add it to tools/oxlint/no-classname/allowlist.ts with a reason.";

export const CLASSNAME_ALLOWLIST: ClassNameAllowlistEntry[] = [
  {
    files: ["apps/mobile/app/dev/text-gallery.tsx"],
    reason:
      "Temporary dev-only gallery for Text QA. TODO(#285): Delete after QA sign-off on Text StyleSheet migration.",
    issue: 285,
  },
  {
    files: [
      "apps/mobile/app/_layout.tsx",
      "apps/mobile/app/recurring/index.tsx",
      "apps/mobile/app/splash.tsx",
      "apps/mobile/app/\\(tabs\\)/ledger/index.tsx",
    ],
    reason: "Screen files using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/access/session-revoked-card.tsx",
      "apps/mobile/components/access/signed-out-card.tsx",
      "apps/mobile/components/access/sign-out-pending-sheet.tsx",
    ],
    reason:
      "Access components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/auth/auth-bottom-sheet.tsx",
      "apps/mobile/components/auth/ui/auth-host.tsx",
    ],
    reason:
      "Auth components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: ["apps/mobile/components/ledger/ledger-list-header.tsx"],
    reason:
      "Ledger components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/recurring/recurring-rule-row.tsx",
      "apps/mobile/components/recurring/recurring-rule-warning.tsx",
    ],
    reason:
      "Recurring components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: ["apps/mobile/components/updates/mandatory-update-gate.tsx"],
    reason:
      "Updates components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/modules/access/auth-sheet-host.tsx",
      "apps/mobile/modules/ledger-data-source/ledger-data-source-gate.tsx",
    ],
    reason:
      "Module components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
];

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
