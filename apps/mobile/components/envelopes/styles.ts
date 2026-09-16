import { StyleSheet } from "react-native";

import { colors, radii, rawColorValues, spacing, typography } from "@/lib/design-tokens";

export const styles = StyleSheet.create({
  screenFlex1: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screenFlexCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[5],
  },
  screenFlexCenterGap3: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[5],
  },
  screenScrollContent: {
    gap: spacing[5],
    paddingHorizontal: spacing[5],
  },
  scrollContentGap4: {
    gap: spacing[4],
    paddingHorizontal: spacing[5],
  },

  gap1: { gap: spacing[1] },
  gap2: { gap: spacing[2] },
  gap3: { gap: spacing[3] },
  gap4: { gap: spacing[4] },
  gap5: { gap: spacing[5] },

  flexRow: { flexDirection: "row" },
  flexRowItemsCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  flexRowItemsCenterJustifyBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  flexRowWrapGap2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  flexRowGap2: {
    flexDirection: "row",
    gap: spacing[2],
  },
  flexRowGap3: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  flexRowGap4: {
    flexDirection: "row",
    gap: spacing[4],
  },
  flex1: { flex: 1 },
  minW0Flex1: {
    minWidth: 0,
    flex: 1,
  },
  minW0Flex1Gap1: {
    minWidth: 0,
    flex: 1,
    gap: spacing[1],
  },

  textInkBase: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  textSemiboldInk: {
    fontFamily: typography.fontBodySemibold,
    color: colors.ink,
  },
  textMediumInkSm: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  textNormalXsInk60: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.6,
  },
  textNormalSmInk60: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  textNormalLeadingInk60: {
    fontFamily: typography.fontBodyNormal,
    lineHeight: spacing[6],
    color: colors.ink,
    opacity: 0.6,
  },
  textMediumXsInk60: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.6,
  },
  textMediumSmInk60: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  textDestructive: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  textDestructiveXs: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.destructive,
  },
  textDestructiveAlert: {
    fontSize: typography.textSm,
    color: colors.destructive,
  },
  textCenterSemiboldInk: {
    textAlign: "center",
    fontFamily: typography.fontBodySemibold,
    color: colors.ink,
  },
  textCenterNormalSmInk60: {
    textAlign: "center",
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },

  heading2xlItalicInk: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    color: colors.ink,
  },
  headingXlItalicInk: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  headingMediumXlItalicInk: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  headingLgItalicInk: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },

  emptyPy8: {
    paddingVertical: spacing[8],
  },
  py3: { paddingVertical: spacing[3] },

  alertBorder: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${rawColorValues.light.destructive}4D`,
    backgroundColor: `${rawColorValues.light.destructive}1A`,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  alertBorderGap2: {
    gap: spacing[2],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: `${rawColorValues.light.destructive}4D`,
    backgroundColor: `${rawColorValues.light.destructive}1A`,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  budgetSummaryCard: {
    gap: spacing[1],
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  budgetSummaryAmount: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.text3xl,
    fontStyle: "italic",
    fontVariant: ["tabular-nums"],
    color: colors.ink,
  },

  envelopeRowCard: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  envelopeRowCardPressed: {
    backgroundColor: colors.surfaceDim,
  },
  envelopeRowIcon: {
    fontSize: typography.textXl,
  },
  envelopeRowTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  envelopeRowAmount: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    fontStyle: "italic",
    fontVariant: ["tabular-nums"],
    color: colors.ink,
  },
  envelopeRowLabelXs: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },

  workspaceOptionBase: {
    minHeight: spacing[14],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  workspaceOptionSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.surfaceContainer,
  },
  workspaceOptionUnselected: {
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
  },
  workspaceOptionSelectedText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
  },

  moveMoneyInput: {
    height: spacing[12],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textBase,
    color: colors.ink,
  },

  endpointOption: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  endpointOptionSelected: {
    backgroundColor: colors.ink,
  },
  endpointOptionUnselected: {
    backgroundColor: colors.surfaceContainer,
  },
  endpointTextSelected: {
    color: colors.surface,
  },
  endpointTextUnselected: {
    color: colors.ink,
  },

  previewCard: {
    gap: spacing[1],
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    padding: spacing[4],
  },

  historyTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  historyEntry: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  categoryOptionBase: {
    minHeight: spacing[14],
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  categoryOptionChecked: {
    borderColor: colors.ink,
    backgroundColor: colors.surfaceContainer,
  },
  categoryOptionDisabled: {
    opacity: 0.5,
  },
  categoryOptionIcon: {
    fontSize: typography.textLg,
  },
  categoryOptionRight: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  categorySubtextXs: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  categorySubtextDestructive: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.destructive,
  },

  restoredOptionBase: {
    minHeight: spacing[14],
    gap: spacing[1],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  restoredOptionChecked: {
    borderColor: colors.ink,
    backgroundColor: colors.surfaceContainer,
  },

  currencyBlock: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  currencyLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textBase,
    color: colors.ink,
  },
  currencyHint: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },

  settingOptionBase: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sortOrderButton: {
    minHeight: spacing[12],
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
  },
  sortOrderButtonPressed: {
    backgroundColor: colors.surfaceDim,
  },
  sortOrderButtonDisabled: {
    opacity: 0.4,
  },
  sortOrderText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },

  setupIntroCard: {
    gap: spacing[2],
    borderRadius: radii["3xl"],
    backgroundColor: colors.surfaceContainer,
    padding: spacing[5],
  },
  setupIntroText: {
    fontFamily: typography.fontBodyNormal,
    lineHeight: spacing[6],
    color: colors.ink,
    opacity: 0.6,
  },

  prerequisiteCard: {
    gap: spacing[3],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surfaceContainer,
    padding: spacing[4],
  },
  prerequisiteText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: spacing[5],
    color: colors.ink,
    opacity: 0.6,
  },

  routeStatusGap3: {
    gap: spacing[3],
  },

  draftPlanHeader: {
    gap: spacing[1],
  },
  draftPlanText: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    lineHeight: spacing[5],
    color: colors.ink,
    opacity: 0.6,
  },

  workspaceTitle: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  workspaceSubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },
  blankPlanText: {
    borderRadius: radii["2xl"],
    backgroundColor: colors.surfaceContainer,
    padding: spacing[4],
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },

  envelopeCard: {
    gap: spacing[3],
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    padding: spacing[4],
  },
  sectionLabel: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWide,
    color: colors.ink,
    opacity: 0.5,
  },
  mappingRowText: {
    flex: 1,
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
  },

  fundingRowBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing[3],
  },
  fundingRowSelected: {
    borderColor: colors.sage,
    backgroundColor: `${rawColorValues.light.sage}1A`,
  },
  fundingRowUnselected: {
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
  },
  fundingIcon: {
    fontSize: typography.textLg,
  },
  fundingBalance: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textSm,
    color: colors.ink,
    opacity: 0.6,
  },

  assignmentInput: {
    height: spacing[11],
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[3],
    fontFamily: typography.fontBodyNormal,
    color: colors.ink,
  },

  resourceInput: {
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.textBase,
    lineHeight: spacing[5],
    color: colors.ink,
  },
});

export const darkStyles = StyleSheet.create({
  alertBorder: {
    borderColor: `${rawColorValues.dark.destructive}4D`,
    backgroundColor: `${rawColorValues.dark.destructive}1A`,
  },
  alertBorderGap2: {
    borderColor: `${rawColorValues.dark.destructive}4D`,
    backgroundColor: `${rawColorValues.dark.destructive}1A`,
  },
  fundingRowSelected: {
    backgroundColor: `${rawColorValues.dark.sage}1A`,
  },
});
