import { StyleSheet } from "react-native";

import { colors, rawColorValues, radii, spacing, typography, shadows } from "@/lib/design-tokens";

export const styles = StyleSheet.create({
  balanceHeroWrap: {
    paddingHorizontal: spacing[5],
    overflow: "hidden",
    borderRadius: radii["2xl"],
  },
  balanceText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.text5xl,
    fontVariant: ["tabular-nums"],
    color: colors.ink,
    lineHeight: typography.text5xl * 1.1,
  },

  filterBarScroll: {
    backgroundColor: colors.background,
  },
  filterBarContent: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    paddingBottom: spacing[3],
  },

  filterChip: {
    flexDirection: "row",
    backgroundColor: colors.accent,
    alignItems: "center",
    gap: spacing[1.5],
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    paddingLeft: spacing[3],
    paddingRight: spacing[1.5],
    paddingVertical: spacing[1.5],
    boxShadow: shadows.sm,
    borderRadius: radii.sm,
    alignSelf: "center",
  },
  filterChipLabel: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.6,
    letterSpacing: typography.trackingWide,
  },
  filterChipButton: {
    width: spacing[5],
    height: spacing[5],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  filterChipIcon: {
    color: colors.ink,
    opacity: 0.6,
  },

  filtersButtonWrap: {
    marginRight: spacing[1],
    height: spacing[9],
    width: spacing[9],
    alignItems: "center",
    justifyContent: "center",
  },
  filtersButtonIcon: {
    color: colors.foreground,
  },
  filtersBadge: {
    position: "absolute",
    right: 0,
    top: 0,
    height: spacing[4],
    minWidth: spacing[4],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[1],
  },
  filtersBadgeText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 10,
    color: colors.surface,
  },
  filtersSheetContent: {
    padding: 18,
    gap: spacing[4],
  },
  filtersSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filtersSheetTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.text2xl,
    fontStyle: "italic",
    color: colors.ink,
  },
  filtersResetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1.5],
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
  },
  filtersResetIcon: {
    color: colors.ink,
  },
  filtersResetText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
    color: colors.ink,
  },
  filterSectionGap: {
    gap: spacing[1.5],
  },
  filterSectionTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textLg,
    fontStyle: "italic",
    color: colors.ink,
  },
  filterSectionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  filterRowChip: {
    borderRadius: radii.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  filterRowChipSelected: {
    backgroundColor: colors.ink,
  },
  filterRowChipUnselected: {
    backgroundColor: colors.surfaceContainer,
  },
  filterRowText: {
    fontFamily: typography.fontBodyMedium,
    fontSize: 13,
  },
  filterRowTextSelected: {
    color: colors.surface,
  },
  filterRowTextUnselected: {
    color: colors.ink,
  },

  homeBrand: {
    width: spacing[12],
    height: spacing[12],
    padding: spacing[2],
  },

  emptyStateButton: {
    marginTop: spacing[1],
    borderWidth: 1,
    borderColor: colors.ink,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
  },
  emptyStateButtonText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: typography.trackingWide,
    color: colors.ink,
  },

  journalDayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2.5],
  },
  journalDayHeaderText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: typography.trackingTight,
    color: colors.ink,
    opacity: 0.5,
  },
  journalDayNetPositive: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: colors.sage,
  },
  journalDayNetNegative: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: colors.terracotta,
  },

  journalListDivider: {
    marginLeft: spacing[16],
    height: 1,
    backgroundColor: colors.ledgerOutline,
  },

  recentJournalCard: {
    marginHorizontal: spacing[5],
    marginTop: spacing[4],
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.ledgerOutline,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    gap: spacing[2],
  },
  sectionTitle: {
    fontFamily: typography.fontHeadingNormal,
    fontSize: typography.textXl,
    fontStyle: "italic",
    color: colors.ink,
  },
  viewAllButton: {
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
  },
  viewAllText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.5,
  },
  loadingWrap: {
    height: spacing[24],
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrapShort: {
    height: spacing[20],
    alignItems: "center",
    justifyContent: "center",
  },

  upcomingCard: {
    marginHorizontal: spacing[5],
    marginTop: spacing[5],
    overflow: "hidden",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.ledgerOutline,
    backgroundColor: colors.surface,
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.05)",
  },
  upcomingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  upcomingRowIcon: {
    width: spacing[10],
    height: spacing[10],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.surface,
  },
  upcomingRowEmoji: {
    fontSize: typography.textLg,
  },
  upcomingRowContent: {
    flex: 1,
    gap: spacing[0.5],
  },
  upcomingRowTitle: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  upcomingRowSubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    color: colors.ink,
    opacity: 0.4,
  },
  upcomingAmountSage: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
    color: colors.sage,
  },
  upcomingAmountInk: {
    fontFamily: typography.fontHeadingMedium,
    fontSize: typography.textBase,
    fontVariant: ["tabular-nums"],
    color: colors.ink,
  },
  upcomingDivider: {
    marginLeft: spacing[16],
    height: 1,
    backgroundColor: colors.ledgerOutline,
  },
  emptyUpcomingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  emptyUpcomingEmoji: {
    fontSize: typography.textXl,
  },
  emptyUpcomingContent: {
    flex: 1,
  },
  emptyUpcomingTitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  emptyUpcomingSubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    lineHeight: spacing[5],
    color: colors.ink,
    opacity: 0.45,
  },
  emptyUpcomingAddButton: {
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
  },
  emptyUpcomingAddText: {
    fontFamily: typography.fontBodySemibold,
    fontSize: typography.textXs,
    color: colors.ink,
  },
  errorUpcomingWrap: {
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
  },
  errorUpcomingTitle: {
    fontFamily: typography.fontBodyMedium,
    fontSize: typography.textSm,
    color: colors.ink,
  },
  errorUpcomingSubtitle: {
    fontFamily: typography.fontBodyNormal,
    fontSize: typography.textXs,
    lineHeight: spacing[5],
    color: colors.ink,
    opacity: 0.45,
  },
  upcomingListWrap: {
    overflow: "hidden",
  },

  homeScreenContent: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export const darkStyles = StyleSheet.create({
  filterChipButtonPressed: {
    backgroundColor: `${rawColorValues.dark.ink}0D`,
  },
  upcomingRowPressed: {
    backgroundColor: colors.surfaceDim,
  },
  viewAllPressed: {
    opacity: 0.5,
  },
});

export const lightStyles = StyleSheet.create({
  filterChipButtonPressed: {
    backgroundColor: `${rawColorValues.light.ink}0D`,
  },
  upcomingRowPressed: {
    backgroundColor: colors.surfaceDim,
  },
  viewAllPressed: {
    opacity: 0.5,
  },
});

export const journalDayBackgroundStyle = {
  backgroundColor: `${rawColorValues.light.surfaceContainer}80`,
};

export const journalDayBackgroundStyleDark = {
  backgroundColor: `${rawColorValues.dark.surfaceContainer}80`,
};
