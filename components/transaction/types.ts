import type { TransactionType } from "@/types";

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: Date;
  currency: string;
  originalAmount: number | null;
  originalCurrency: string | null;
  exchangeRate: number | null;
}

export interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  submitLabel?: string;
  onDelete?: () => void;
}

export interface FormValues {
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: Date;
}
