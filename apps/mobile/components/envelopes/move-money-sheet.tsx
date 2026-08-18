import { View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { AssignmentHistory } from "@/components/envelopes/assignment-history";
import { MoveMoneyDetails } from "@/components/envelopes/move-money-details";
import { MoveMoneyEndpointPicker } from "@/components/envelopes/move-money-endpoint-picker";
import { MoveMoneyPreviewCard } from "@/components/envelopes/move-money-preview-card";
import { useMoveMoneySheet } from "@/components/envelopes/use-move-money-sheet";
import { CreateResourceBottomSheet } from "@/components/resource/create-resource-bottom-sheet";
import { CreateResourceSheetFooter } from "@/components/resource/create-resource-sheet-footer";
import { layoutTransition } from "@/components/transaction/constants";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import type { BudgetProjection } from "@/modules/budgeting/budgeting";

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
  const {
    amount,
    correctionId,
    destinationEnvelopeId,
    handleAmountChange,
    handleCorrectionSelect,
    handleDestinationChange,
    handlePeriodChange,
    handlePreview,
    handleSourceChange,
    handleSubmit,
    history,
    isSubmitting,
    moveError,
    period,
    preview,
    previewError,
    selectedCorrection,
    sourceEnvelopeId,
  } = useMoveMoneySheet({ currency, onSaved, period: initialPeriod, projection });

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
          error={moveError}
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
