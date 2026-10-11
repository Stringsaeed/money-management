import { CategoryTile, colors, Icon, ListGroup, ListRow, Sheet, type IconName } from "@/ui/trove";

export interface SearchOption {
  readonly key: string;
  readonly label: string;
  readonly icon?: IconName;
  /** A category's emoji, shown on its round tile. */
  readonly emoji?: string;
}

interface SearchOptionSheetProps {
  readonly open: boolean;
  readonly title: string;
  readonly options: readonly SearchOption[];
  readonly selected: string;
  readonly onSelect: (key: string) => void;
  readonly onDismiss: () => void;
}

/** Single-choice picker behind a search chip: tapping a row applies it and closes the sheet. */
export function SearchOptionSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onDismiss,
}: SearchOptionSheetProps) {
  return (
    <Sheet onDismiss={onDismiss} open={open} title={title}>
      <ListGroup>
        {options.map((option) => (
          <ListRow
            key={option.key}
            accessibilityLabel={
              option.key === selected ? `${option.label}, selected` : option.label
            }
            icon={option.icon}
            leading={
              option.emoji ? <CategoryTile icon={option.emoji} round size="sm" /> : undefined
            }
            onPress={() => {
              onSelect(option.key);
              onDismiss();
            }}
            title={option.label}
            trailing={
              option.key === selected ? (
                <Icon color={colors.accent.text} name="check" size={20} />
              ) : undefined
            }
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
