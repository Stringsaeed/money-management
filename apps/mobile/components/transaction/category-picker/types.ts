export interface CategoryPickerProps {
  categories: { id: string; name: string; icon: string; color: string; type: string }[];
  selectedId: string | null;
  onChange: (id: string) => void;
  children?: React.ReactNode;
}
