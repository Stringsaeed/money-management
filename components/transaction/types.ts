import type { RecurrenceFrequency, TransactionType } from "@/types";

/** Recurrence cadence + end condition captured by the form (start date = `date`). */
export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  intervalCount: number;
  endDate: Date | null; // "on_date" end
  endCount: number | null; // "after_count" end
}

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
  recurrence: RecurrenceConfig;
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
  frequency: RecurrenceFrequency;
  intervalCount: number;
  endDate: Date | null;
  endCount: number | null;
}
