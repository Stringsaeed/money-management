import { useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AssignmentHistory } from "@/components/envelopes/assignment-history";
import { MoveMoneyDetails } from "@/components/envelopes/move-money-details";
import { MoveMoneyEndpointPicker } from "@/components/envelopes/move-money-endpoint-picker";
import { MoveMoneyPreviewCard } from "@/components/envelopes/move-money-preview-card";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAssignmentHistory, useCorrectMoveMoney, useMoveMoney } from "@/hooks/use-move-money";
import { createBudgetingCoordinator } from "@/modules/budgeting/budgeting";
import type {
  BudgetProjection,
  AssignmentHistoryEntry,
  MoveMoneyEndpoint,
  MoveMoneyPreview,
  MoveMoneyRequest,
} from "@/modules/budgeting/budgeting";
import { useSQLiteContext } from "expo-sqlite";

interface MoveMoneySheetProps {
  currency: string;
  onDismiss: VoidFunction;
  onSaved: VoidFunction;
  period: string;
  projection: BudgetProjection;
}

export function MoveMoneySheet({
  currency,
  onDismiss,
  onSaved,
  period: initialPeriod,
  projection,
}: MoveMoneySheetProps) {
  const database = useSQLiteContext();
  const moveMoney = useMoveMoney();
  const correctMoveMoney = useCorrectMoveMoney();
  const [sourceEnvelopeId, setSourceEnvelopeId] = useState<MoveMoneyEndpoint>(null);
  const [destinationEnvelopeId, setDestinationEnvelopeId] = useState<MoveMoneyEndpoint>(
    projection.envelopes[0]?.id ?? null,
  );
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(initialPeriod);
  const [preview, setPreview] = useState<MoveMoneyPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const history = useAssignmentHistory(currency, period);
  const isSubmitting = moveMoney.isPending || correctMoveMoney.isPending;

  const resetPreview = () => {
    setPreview(null);
    setPreviewError(null);
  };
  const handleSourceChange = (nextSourceEnvelopeId: MoveMoneyEndpoint) => {
    setSourceEnvelopeId(nextSourceEnvelopeId);
    resetPreview();
  };
  const handleDestinationChange = (nextDestinationEnvelopeId: MoveMoneyEndpoint) => {
    setDestinationEnvelopeId(nextDestinationEnvelopeId);
    resetPreview();
  };
  const handleAmountChange = (nextAmount: string) => {
    setAmount(nextAmount);
    resetPreview();
  };
  const handlePeriodChange = (nextPeriod: string) => {
    setPeriod(nextPeriod);
    resetPreview();
  };
  const handleCorrectionSelect = (assignment: AssignmentHistoryEntry) => {
    setAmount(String(assignment.amountMinor));
    setCorrectionId(assignment.id);
    setDestinationEnvelopeId(assignment.destinationEnvelopeId);
    setPeriod(assignment.budgetPeriod);
    setSourceEnvelopeId(assignment.sourceEnvelopeId);
    resetPreview();
  };
  const createRequest = (): MoveMoneyRequest => ({
    amountMinor: Number(amount),
    currency,
    destinationEnvelopeId,
    id: `assignment-${Date.now()}`,
    now: new Date().toISOString(),
    period,
    sourceEnvelopeId,
  });
  const createCorrectionRequest = () => ({
    ...createRequest(),
    originalAssignmentId: correctionId ?? "",
    reversalId: `assignment-reversal-${Date.now()}`,
  });
  const handlePreview = async () => {
    try {
      setPreviewError(null);
      const budgeting = createBudgetingCoordinator(database);
      const nextPreview = correctionId
        ? await budgeting.previewCorrectMoveMoney(createCorrectionRequest())
        : await budgeting.previewMoveMoney(createRequest());
      setPreview(nextPreview);
    } catch (error) {
      setPreview(null);
      setPreviewError(error instanceof Error ? error.message : "Review the Move Money details.");
    }
  };
  const handleSubmit = () => {
    if (!preview) {
      setPreviewError("Preview the Move Money result before confirming it.");
      return;
    }
    const request = createRequest();
    if (correctionId) {
      correctMoveMoney.mutate(
        {
          ...createCorrectionRequest(),
        },
        { onSuccess: onSaved },
      );
      return;
    }
    moveMoney.mutate(request, { onSuccess: onSaved });
  };
  const selectedCorrection = correctionId
    ? (history.data?.find(({ id }) => id === correctionId) ?? null)
    : null;

  return (
    <CreateResourceBottomSheet
      autoPresent
      content={
        <View className="gap-4">
          <Text className="font-body-normal text-sm text-ink/60">
            Move exact Money inside the {currency} workspace. Committed moves stay in history.
          </Text>
          <MoveMoneyEndpointPicker
            accessibilityLabel="Move Money source"
            label="Source"
            onChange={handleSourceChange}
            projection={projection}
            selectedId={sourceEnvelopeId}
          />
          <MoveMoneyEndpointPicker
            accessibilityLabel="Move Money destination"
            label="Destination"
            onChange={handleDestinationChange}
            projection={projection}
            selectedId={destinationEnvelopeId}
          />
          <MoveMoneyDetails
            amount={amount}
            onAmountChange={handleAmountChange}
            onPeriodChange={handlePeriodChange}
            period={period}
          />
          {selectedCorrection ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} layout={layoutTransition}>
              <Text accessibilityLiveRegion="polite" className="font-body-medium text-sm text-ink">
                Correcting Assignment {selectedCorrection.id}
              </Text>
            </Animated.View>
          ) : null}
          <Button accessibilityLabel="Preview Move Money" onPress={handlePreview} variant="outline">
            <Text>Preview Move</Text>
          </Button>
          <MoveMoneyPreviewCard error={previewError} preview={preview} />
          <AssignmentHistory
            entries={history.data ?? []}
            error={history.error}
            isLoading={history.isLoading}
            onSelectOriginal={handleCorrectionSelect}
            selectedOriginalId={correctionId}
          />
        </View>
      }
      footer={
        <CreateResourceSheetFooter
          error={moveMoney.error?.message ?? correctMoveMoney.error?.message}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          submitLabel={correctionId ? "Correct Move Money" : "Move Money"}
          submittingLabel={correctionId ? "Correcting…" : "Moving…"}
        />
      }
      onDismiss={onDismiss}
      title="Move Money"
    />
  );
}
