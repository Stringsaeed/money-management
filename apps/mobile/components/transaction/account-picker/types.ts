import type { Account } from "@/types";

export interface AccountPickerProps {
  accounts: Pick<Account, "id" | "name" | "currency" | "lifecycle">[];
  selectedId: string;
  onChange: (id: string) => void;
  children?: React.ReactNode;
}
