import { SetupEnvelopeCard } from "@/components/envelopes/setup/setup-envelope-card";
import type {
  SetupDraftCategorySuggestion,
  SetupDraftEnvelope,
} from "@/modules/budgeting/budgeting";

interface SetupDraftEnvelopeItemProps {
  categories: readonly SetupDraftCategorySuggestion[];
  currency: string;
  envelope: SetupDraftEnvelope;
  mergeSelected: boolean;
  onMoveCategory: (currency: string, categoryId: string, envelopeId: string) => void;
  onRemoveCategory: (currency: string, envelopeId: string, categoryId: string) => void;
  onToggleRollover: (currency: string, envelopeId: string) => void;
  onToggleMergeSelection: (envelopeId: string) => void;
  onUpdateEnvelope: (
    currency: string,
    envelopeId: string,
    changes: Partial<SetupDraftEnvelope>,
  ) => void;
}

export const SetupDraftEnvelopeItem = ({
  categories,
  currency,
  envelope,
  mergeSelected,
  onMoveCategory,
  onRemoveCategory,
  onToggleRollover,
  onToggleMergeSelection,
  onUpdateEnvelope,
}: SetupDraftEnvelopeItemProps) => {
  const handleChange = (changes: Partial<SetupDraftEnvelope>) =>
    onUpdateEnvelope(currency, envelope.id, changes);
  const handleMapCategory = (categoryId: string) =>
    onMoveCategory(currency, categoryId, envelope.id);
  const handleRemoveCategory = (categoryId: string) =>
    onRemoveCategory(currency, envelope.id, categoryId);
  const handleToggleRollover = () => onToggleRollover(currency, envelope.id);
  const handleToggleSelection = () => onToggleMergeSelection(envelope.id);
  return (
    <SetupEnvelopeCard
      categories={categories}
      envelope={envelope}
      mergeSelected={mergeSelected}
      onChange={handleChange}
      onMapCategory={handleMapCategory}
      onRemoveCategory={handleRemoveCategory}
      onToggleRollover={handleToggleRollover}
      onToggleMergeSelection={handleToggleSelection}
    />
  );
};
