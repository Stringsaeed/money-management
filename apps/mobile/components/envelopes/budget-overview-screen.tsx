import { useState } from "react";
import { ScrollView, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { BudgetSummaryCard } from "@/components/envelopes/budget-summary-card";
import { EnvelopeFormSheet } from "@/components/envelopes/envelope-form/envelope-form-sheet";
import { EnvelopeRow } from "@/components/envelopes/envelope-row";
import { WorkspaceOption } from "@/components/envelopes/workspace-option";
import { WorkspaceRouteStatus } from "@/components/envelopes/workspace-route-status";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  useBudgetProjection,
  useEnvelopeFormOptions,
  useSelectBudgetWorkspace,
} from "@/hooks/use-budget-workspaces";
import type { EnvelopeSummary, WorkspaceSelection } from "@/modules/budgeting/budgeting";
import { formatMonth, today } from "@/utils/date";

interface BudgetOverviewScreenProps {
  selection: WorkspaceSelection;
}

type SheetState = { kind: "create" } | { kind: "edit"; envelope: EnvelopeSummary } | null;

export function BudgetOverviewScreen({ selection }: BudgetOverviewScreenProps) {
  const selectedCurrency = selection.selectedCurrency ?? selection.workspaces[0].currency;
  const period = today().slice(0, 7);
  const projection = useBudgetProjection(selectedCurrency, period);
  const formOptions = useEnvelopeFormOptions(selectedCurrency, period);
  const selectWorkspace = useSelectBudgetWorkspace();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [showArchived, setShowArchived] = useState(false);

  if (projection.isLoading) return <WorkspaceRouteStatus loadingLabel="Loading monthly budget" />;
  if (projection.error || !projection.data) {
    return (
      <WorkspaceRouteStatus
        action={
          <Button
            accessibilityLabel="Retry monthly budget"
            onPress={() => projection.refetch()}
            variant="outline"
          >
            <Text>Retry</Text>
          </Button>
        }
        title="Monthly budget is unavailable"
        message="Your Envelope values could not be loaded. Return to Envelopes and try again."
      />
    );
  }

  const month = period.split("-").map(Number);
  const visibleEnvelopes = showArchived
    ? projection.data.archivedEnvelopes
    : projection.data.envelopes;
  return (
    <>
      <ScrollView
        className="flex-1 bg-surface pt-safe-offset-20"
        contentContainerClassName="gap-5 px-5 pb-safe-offset-24"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Animated.View entering={FadeIn} exiting={FadeOut} className="gap-2">
          <Text className="font-heading-medium text-2xl italic text-ink">
            {formatMonth(month[0], month[1])}
          </Text>
          <Text className="font-body-normal text-sm text-ink/60">
            Plan exact Money inside one currency Funding Pool.
          </Text>
        </Animated.View>

        <View accessibilityRole="radiogroup" className="gap-2">
          {selection.workspaces.map(({ currency }) => (
            <WorkspaceOption
              key={currency}
              currency={currency}
              disabled={selectWorkspace.isPending}
              selected={currency === selectedCurrency}
              onSelect={selectWorkspace.mutate}
            />
          ))}
        </View>

        {selectWorkspace.error ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            entering={FadeIn}
            exiting={FadeOut}
            layout={layoutTransition}
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <Text selectable className="font-body-medium text-sm text-destructive">
              Couldn&apos;t remember {selectWorkspace.variables?.currency ?? "that currency"}.
              Choose it again to retry.
            </Text>
          </Animated.View>
        ) : null}

        <BudgetSummaryCard money={projection.data.unassignedMoney} />

        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-heading-medium text-xl italic text-ink">
            {showArchived ? "Archived Envelopes" : "Envelopes"}
          </Text>
          {!showArchived ? (
            <Button
              accessibilityLabel="New Envelope"
              disabled={formOptions.isLoading || Boolean(formOptions.error)}
              onPress={() => setSheet({ kind: "create" })}
              variant="secondary"
            >
              <Text>New Envelope</Text>
            </Button>
          ) : null}
        </View>

        {formOptions.error ? (
          <Animated.View
            accessibilityLiveRegion="polite"
            entering={FadeIn}
            exiting={FadeOut}
            layout={layoutTransition}
            role="alert"
            className="gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
          >
            <Text selectable className="font-body-medium text-sm text-destructive">
              Category Mappings could not be loaded. Retry before creating or editing an Envelope.
            </Text>
            <Button
              accessibilityLabel="Retry Envelope categories"
              onPress={() => formOptions.refetch()}
              size="sm"
              variant="outline"
            >
              <Text>Retry Categories</Text>
            </Button>
          </Animated.View>
        ) : null}

        <Animated.View layout={layoutTransition} className="gap-2">
          {visibleEnvelopes.length === 0 ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} className="py-8">
              <Text className="text-center font-body-medium text-sm text-ink/60">
                {showArchived ? "No archived Envelopes" : "No active Envelopes yet"}
              </Text>
            </Animated.View>
          ) : (
            visibleEnvelopes.map((envelope) => (
              <EnvelopeRow
                key={envelope.id}
                envelope={envelope}
                onEdit={
                  showArchived
                    ? undefined
                    : (selected) => setSheet({ kind: "edit", envelope: selected })
                }
              />
            ))
          )}
        </Animated.View>

        <Button
          accessibilityLabel={showArchived ? "View active Envelopes" : "View archived Envelopes"}
          onPress={() => setShowArchived((current) => !current)}
          variant="ghost"
        >
          <Text>
            {showArchived
              ? "View active Envelopes"
              : `Archived Envelopes (${projection.data.archivedEnvelopes.length})`}
          </Text>
        </Button>
      </ScrollView>

      {sheet && formOptions.data ? (
        <EnvelopeFormSheet
          currency={selectedCurrency}
          envelope={sheet.kind === "edit" ? sheet.envelope : undefined}
          maximumSortOrder={
            sheet.kind === "edit"
              ? Math.max(0, projection.data.envelopes.length - 1)
              : projection.data.envelopes.length
          }
          onDismiss={() => setSheet(null)}
          onSaved={() => setSheet(null)}
          options={formOptions.data}
        />
      ) : null}
    </>
  );
}
