import { useState } from "react";

import { useAssignmentHistory, useCorrectMoveMoney, useMoveMoney } from "@/hooks/use-move-money";
import { useBudgetingCoordinator } from "@/hooks/use-budgeting-coordinator";
import type {
  AssignmentHistoryEntry,
  BudgetProjection,
  CorrectMoveMoneyRequest,
  MoveMoneyEndpoint,
  MoveMoneyPreview,
  MoveMoneyRequest,
} from "@/modules/budgeting/budgeting";
import { nowIso } from "@/utils/date";

interface UseMoveMoneySheetOptions {
  currency: string;
  onSaved: VoidFunction;
  period: string;
  projection: BudgetProjection;
}

export function useMoveMoneySheet({
  currency,
  onSaved,
  period: initialPeriod,
  projection,
}: UseMoveMoneySheetOptions) {
  const budgeting = useBudgetingCoordinator();
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
  const selectedCorrection = correctionId
    ? (history.data?.find(({ id }) => id === correctionId) ?? null)
    : null;

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
    now: nowIso(),
    period,
    sourceEnvelopeId,
  });
  const createCorrectionRequest = (): CorrectMoveMoneyRequest => ({
    ...createRequest(),
    originalAssignmentId: correctionId ?? "",
    reversalId: `assignment-reversal-${Date.now()}`,
  });
  const handlePreview = async () => {
    try {
      setPreviewError(null);
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
    if (correctionId) {
      correctMoveMoney.mutate(createCorrectionRequest(), { onSuccess: onSaved });
      return;
    }
    moveMoney.mutate(createRequest(), { onSuccess: onSaved });
  };

  return {
    amount,
    correctionId,
    handleAmountChange,
    handleCorrectionSelect,
    handleDestinationChange,
    handlePeriodChange,
    handlePreview,
    handleSourceChange,
    handleSubmit,
    history,
    isSubmitting,
    moveError: moveMoney.error?.message ?? correctMoveMoney.error?.message,
    period,
    preview,
    previewError,
    selectedCorrection,
    sourceEnvelopeId,
    destinationEnvelopeId,
  };
}
