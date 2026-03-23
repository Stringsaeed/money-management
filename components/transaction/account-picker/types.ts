export interface AccountPickerProps {
  accounts: { id: string; name: string; currency: string }[];
  selectedId: string;
  onChange: (id: string) => void;
  children?: React.ReactNode;
}
