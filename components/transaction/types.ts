import type { TransactionType } from "@/types";

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  isRecurring: boolean;
  description: string;
  date: Date;
  currency: string;
  originalAmount: number | null;
  originalCurrency: string | null;
  exchangeRate: number | null;
}

export interface TransactionFormHandle {
  submit: () => void;
}

export interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  isRecurring: boolean;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  formRef?: React.MutableRefObject<TransactionFormHandle | null>;
}

export interface FormValues {
  accountId: string;
  toAccountId: string | null;
  categoryId: string | null;
  description: string;
  date: Date;
}
