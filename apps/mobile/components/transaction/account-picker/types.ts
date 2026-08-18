export interface AccountPickerProps {
  accounts: { id: string; name: string; currency: string; lifecycle?: "active" | "archived" }[];
  selectedId: string;
  onChange: (id: string) => void;
  children?: React.ReactNode;
}
