export type ClassNameAllowlistEntry = {
  files: string[];
  reason: string;
  issue: number;
};

export const CLASSNAME_MIGRATION_MESSAGE =
  "NativeWind `className` is deprecated in favor of the theme module's StyleSheet approach. See issue #279 for the migration epic. If this file must use className temporarily, add it to tools/oxlint/no-classname/allowlist.ts with a reason.";

export const CLASSNAME_ALLOWLIST: ClassNameAllowlistEntry[] = [
  {
    files: [
      "apps/mobile/app/account/\\[id\\].tsx",
      "apps/mobile/app/accounts.tsx",
      "apps/mobile/app/activity.tsx",
      "apps/mobile/app/categories.tsx",
      "apps/mobile/app/category/new.tsx",
      "apps/mobile/app/_layout.tsx",
      "apps/mobile/app/recurring/index.tsx",
      "apps/mobile/app/splash.tsx",
      "apps/mobile/app/\\(tabs\\)/\\(home\\)/index.tsx",
      "apps/mobile/app/\\(tabs\\)/ledger/index.tsx",
      "apps/mobile/app/\\(tabs\\)/settings/household.tsx",
      "apps/mobile/app/\\(tabs\\)/settings/index.tsx",
      "apps/mobile/app/transaction/\\[id\\].tsx",
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
      "apps/mobile/components/account/account-archive-blocker-item.tsx",
      "apps/mobile/components/account/account-archive-blockers.tsx",
      "apps/mobile/components/account/account-currency-option-row.tsx",
      "apps/mobile/components/account/account-currency-picker.tsx",
      "apps/mobile/components/account/account-form-balance-section.tsx",
      "apps/mobile/components/account/account-form-content.tsx",
      "apps/mobile/components/account/account-form-preview.tsx",
      "apps/mobile/components/account/account-lifecycle-actions.tsx",
      "apps/mobile/components/account/account-picker.tsx",
      "apps/mobile/components/account/account-type-picker.tsx",
      "apps/mobile/components/account/archived-account-summary.tsx",
    ],
    reason:
      "Account components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/activity/activity-date-range-filter.tsx",
      "apps/mobile/components/activity/activity-detail-sheet.tsx",
      "apps/mobile/components/activity/activity-entry-row.tsx",
      "apps/mobile/components/activity/activity-user-filter.tsx",
    ],
    reason:
      "Activity components using NativeWind className pending migration to theme module StyleSheet.",
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
    files: [
      "apps/mobile/components/category/category-form-content.tsx",
      "apps/mobile/components/category/category-form-preview.tsx",
      "apps/mobile/components/category/category-lifecycle-actions.tsx",
      "apps/mobile/components/category/category-picker.tsx",
      "apps/mobile/components/category/category-type-picker.tsx",
    ],
    reason:
      "Category components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/common/amount-input.tsx",
      "apps/mobile/components/common/color-picker.tsx",
      "apps/mobile/components/common/emoji-picker.tsx",
      "apps/mobile/components/common/empty-state.tsx",
    ],
    reason:
      "Common components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/envelopes/assignment-history.tsx",
      "apps/mobile/components/envelopes/budget-overview-screen.tsx",
      "apps/mobile/components/envelopes/budget-summary-card.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-appearance-fields.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-category-fields.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-category-option.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-form-content.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-identity-fields.tsx",
      "apps/mobile/components/envelopes/envelope-form/envelope-settings-fields.tsx",
      "apps/mobile/components/envelopes/envelope-form/restored-category-confirmation.tsx",
      "apps/mobile/components/envelopes/envelope-row.tsx",
      "apps/mobile/components/envelopes/move-money-details.tsx",
      "apps/mobile/components/envelopes/move-money-endpoint-picker.tsx",
      "apps/mobile/components/envelopes/move-money-preview-card.tsx",
      "apps/mobile/components/envelopes/move-money-sheet.tsx",
      "apps/mobile/components/envelopes/setup/setup-assignment-input.tsx",
      "apps/mobile/components/envelopes/setup/setup-category-mapping-row.tsx",
      "apps/mobile/components/envelopes/setup/setup-draft-plan.tsx",
      "apps/mobile/components/envelopes/setup/setup-draft-route-status.tsx",
      "apps/mobile/components/envelopes/setup/setup-draft-screen.tsx",
      "apps/mobile/components/envelopes/setup/setup-draft-workspace.tsx",
      "apps/mobile/components/envelopes/setup/setup-envelope-card.tsx",
      "apps/mobile/components/envelopes/setup/setup-envelope-identity-fields.tsx",
      "apps/mobile/components/envelopes/setup/setup-funding-account-row.tsx",
      "apps/mobile/components/envelopes/setup/setup-introduction.tsx",
      "apps/mobile/components/envelopes/setup/setup-prerequisite-card.tsx",
      "apps/mobile/components/envelopes/workspace-option.tsx",
      "apps/mobile/components/envelopes/workspace-route-status.tsx",
    ],
    reason:
      "Envelopes/budgeting components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/home/balance-hero.tsx",
      "apps/mobile/components/home/filter-bar.tsx",
      "apps/mobile/components/home/filter-chip.tsx",
      "apps/mobile/components/home/filters-button.tsx",
      "apps/mobile/components/home/home-brand.tsx",
      "apps/mobile/components/home/home-empty-state.tsx",
      "apps/mobile/components/home/journal-day-header.tsx",
      "apps/mobile/components/home/journal-list-item-row.tsx",
      "apps/mobile/components/home/recent-journal-section.tsx",
      "apps/mobile/components/home/upcoming-recurring-row.tsx",
      "apps/mobile/components/home/upcoming-recurring-section.tsx",
    ],
    reason:
      "Home components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/household/active-household-panel.tsx",
      "apps/mobile/components/household/create-household-form.tsx",
      "apps/mobile/components/household/enable-sync-card.tsx",
      "apps/mobile/components/household/household-members.tsx",
      "apps/mobile/components/household/join-household-form.tsx",
      "apps/mobile/components/household/ledger-selector.tsx",
      "apps/mobile/components/household/personal-sync-card.tsx",
      "apps/mobile/components/household/signed-in-household.tsx",
      "apps/mobile/components/household/sync-status-card.tsx",
    ],
    reason:
      "Household components using NativeWind className pending migration to theme module StyleSheet.",
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
      "apps/mobile/components/money-movement/market-hero.tsx",
      "apps/mobile/components/money-movement/market-source-badge.tsx",
      "apps/mobile/components/money-movement/market-state-card.tsx",
      "apps/mobile/components/money-movement/money-movement-screen.tsx",
      "apps/mobile/components/money-movement/quote-row.tsx",
      "apps/mobile/components/money-movement/quote-section.tsx",
      "apps/mobile/components/money-movement/refresh-market-button.tsx",
    ],
    reason:
      "Money movement components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/navigation/glass-tab-bar/create-tab-button.tsx",
      "apps/mobile/components/navigation/glass-tab-bar/glass-surface.tsx",
      "apps/mobile/components/navigation/glass-tab-bar/glass-tab-bar.tsx",
      "apps/mobile/components/navigation/glass-tab-bar/glass-tab-button.tsx",
    ],
    reason:
      "Navigation components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/onboarding/onboarding-balance-step.tsx",
      "apps/mobile/components/onboarding/onboarding-bloom-burst.tsx",
      "apps/mobile/components/onboarding/onboarding-complete-step.tsx",
      "apps/mobile/components/onboarding/onboarding-cta.tsx",
      "apps/mobile/components/onboarding/onboarding-flow.tsx",
      "apps/mobile/components/onboarding/onboarding-header.tsx",
      "apps/mobile/components/onboarding/onboarding-name-step.tsx",
      "apps/mobile/components/onboarding/onboarding-progress.tsx",
      "apps/mobile/components/onboarding/onboarding-step-heading.tsx",
      "apps/mobile/components/onboarding/onboarding-style-step.tsx",
      "apps/mobile/components/onboarding/onboarding-text-field.tsx",
      "apps/mobile/components/onboarding/onboarding-welcome-step.tsx",
    ],
    reason:
      "Onboarding components using NativeWind className pending migration to theme module StyleSheet.",
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
    files: [
      "apps/mobile/components/rejected-changes/rejected-change-card.tsx",
      "apps/mobile/components/rejected-changes/rejected-change-edit-form.tsx",
      "apps/mobile/components/rejected-changes/rejected-change-edit-screen.tsx",
      "apps/mobile/components/rejected-changes/rejected-changes-empty-state.tsx",
      "apps/mobile/components/rejected-changes/rejected-changes-screen.tsx",
      "apps/mobile/components/rejected-changes/rejection-kind-badge.tsx",
    ],
    reason:
      "Rejected changes components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/resource/create-resource-bottom-sheet.tsx",
      "apps/mobile/components/resource/create-resource-sheet-footer.tsx",
      "apps/mobile/components/resource/resource-form-field.tsx",
      "apps/mobile/components/resource/resource-sheet-delete-button.tsx",
    ],
    reason:
      "Resource components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/settings/account-row.tsx",
      "apps/mobile/components/settings/card.tsx",
      "apps/mobile/components/settings/category-row.tsx",
      "apps/mobile/components/settings/divider.tsx",
      "apps/mobile/components/settings/erase-local-data-control.tsx",
      "apps/mobile/components/settings/section-header.tsx",
      "apps/mobile/components/settings/settings-row.tsx",
      "apps/mobile/components/settings/update-section.tsx",
    ],
    reason:
      "Settings components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/transaction/account-picker/account-picker.tsx",
      "apps/mobile/components/transaction/amount-display.tsx",
      "apps/mobile/components/transaction/breadcrumb-segment.tsx",
      "apps/mobile/components/transaction/category-picker/category-picker.tsx",
      "apps/mobile/components/transaction/note-input.tsx",
      "apps/mobile/components/transaction/num-pad.tsx",
      "apps/mobile/components/transaction/recurrence/count-stepper.tsx",
      "apps/mobile/components/transaction/recurrence/ends-control.tsx",
      "apps/mobile/components/transaction/recurrence/repeat-control.tsx",
      "apps/mobile/components/transaction/transaction-date-picker/transaction-date-picker.tsx",
      "apps/mobile/components/transaction/transaction-form.tsx",
      "apps/mobile/components/transaction/transaction-group.tsx",
      "apps/mobile/components/transaction/transaction-row.tsx",
      "apps/mobile/components/transaction/ui/transaction-text-field.tsx",
    ],
    reason:
      "Transaction components using NativeWind className pending migration to theme module StyleSheet.",
    issue: 279,
  },
  {
    files: [
      "apps/mobile/components/ui/icon.tsx",
      "apps/mobile/components/ui/input.tsx",
      "apps/mobile/components/ui/modal-bottom-sheet.tsx",
      "apps/mobile/components/ui/money-text.tsx",
    ],
    reason:
      "UI primitives using NativeWind className pending migration to theme module StyleSheet.",
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
