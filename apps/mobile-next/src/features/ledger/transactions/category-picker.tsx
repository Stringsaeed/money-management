import { useState } from "react";

import type { V2Category } from "@trove/api/v2/contracts";

import { CategoryTile, colors, EmptyState, Icon, ListGroup, ListRow, Sheet } from "@/ui/trove";

import { hasAiPickChoice } from "./ai-pick";
import { BreadcrumbSegment } from "./breadcrumb-segment";
import { afterSheetCloses } from "./transaction-create-actions";
import { categoryChip, categoryEmoji } from "./transaction-display";

type CategoryKind = V2Category["kind"];

interface CategoryPickerProps {
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly isTransfer: boolean;
  /** Kind whose "AI pick" is selected, or null when a category or transfer is. */
  readonly autoKind: CategoryKind | null;
  readonly onSelectCategory: (category: V2Category) => void;
  readonly onSelectTransfer: () => void;
  /** Omitted when AI is off or the transaction is being edited. */
  readonly onSelectAuto?: (kind: CategoryKind) => void;
  readonly onCreateCategory?: () => void;
}

/** 40pt category tile plus its 12pt gap inside the 16pt row padding. */
const DIVIDER_INSET = 68;

interface CategorySectionProps {
  readonly title: string;
  readonly categories: readonly V2Category[];
  readonly selectedId: string | null;
  readonly autoSelected: boolean;
  readonly onSelect: (category: V2Category) => void;
  readonly onSelectAuto?: () => void;
}

const checkMark = (selected: boolean) =>
  selected ? <Icon color={colors.accent.text} name="check" size={20} /> : null;

function CategorySection({
  title,
  categories,
  selectedId,
  autoSelected,
  onSelect,
  onSelectAuto,
}: CategorySectionProps) {
  if (categories.length === 0) return null;
  return (
    <ListGroup dividerInset={DIVIDER_INSET} header={title}>
      {onSelectAuto ? (
        <ListRow
          key="auto"
          leading={<CategoryTile icon="✨" />}
          onPress={onSelectAuto}
          title="AI pick"
          trailing={checkMark(autoSelected)}
        />
      ) : null}
      {categories.map((category) => (
        <ListRow
          key={category.id}
          leading={<CategoryTile icon={categoryEmoji(category.icon)} />}
          onPress={() => onSelect(category)}
          title={category.name}
          trailing={checkMark(category.id === selectedId)}
        />
      ))}
    </ListGroup>
  );
}

export function CategoryPicker({
  categories,
  selectedId,
  isTransfer,
  autoKind,
  onSelectCategory,
  onSelectTransfer,
  onSelectAuto,
  onCreateCategory,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const createCategory = onCreateCategory
    ? () => {
        setOpen(false);
        afterSheetCloses(onCreateCategory);
      }
    : undefined;
  const chip = categoryChip(
    categories.find((item) => item.id === selectedId),
    isTransfer,
    autoKind !== null,
  );
  const highlightedId = isTransfer ? null : selectedId;
  const selectCategory = (category: V2Category) => {
    onSelectCategory(category);
    setOpen(false);
  };
  const selectAuto = (kind: CategoryKind) =>
    onSelectAuto && hasAiPickChoice(categories, kind)
      ? () => {
          onSelectAuto(kind);
          setOpen(false);
        }
      : undefined;

  return (
    <>
      <BreadcrumbSegment {...chip} onPress={() => setOpen(true)} />
      <Sheet open={open} onDismiss={() => setOpen(false)} title="Category">
        {categories.length === 0 ? (
          <EmptyState
            actionLabel={createCategory ? "Add category" : undefined}
            framed={false}
            icon="category"
            message="Add a category to sort your spending and income. You can still record a transfer below."
            onAction={createCategory}
            title="No categories yet"
          />
        ) : null}
        <CategorySection
          title="Expenses"
          categories={categories.filter((item) => item.kind === "expense")}
          selectedId={highlightedId}
          autoSelected={autoKind === "expense"}
          onSelect={selectCategory}
          onSelectAuto={selectAuto("expense")}
        />
        <CategorySection
          title="Income"
          categories={categories.filter((item) => item.kind === "income")}
          selectedId={highlightedId}
          autoSelected={autoKind === "income"}
          onSelect={selectCategory}
          onSelectAuto={selectAuto("income")}
        />
        <ListGroup header="Move money">
          <ListRow
            icon="transfer"
            onPress={() => {
              onSelectTransfer();
              setOpen(false);
            }}
            title="Transfer"
            trailing={checkMark(isTransfer)}
          />
        </ListGroup>
      </Sheet>
    </>
  );
}
