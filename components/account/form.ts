import { AccountTypeColors } from "@/constants/theme";
import type { AccountType } from "@/types";
import { formOptions, useForm } from "@tanstack/react-form";
import { ACCOUNT_TYPE_META } from "./account-form-options";
import { decimalStringToCents } from "@/utils/currency";
import { useCreateAccount } from "@/hooks/use-accounts";

export interface AccountFormValues {
  amount: string;
  color: string;
  currency: string;
  name: string;
  type: AccountType;
}

export const accountFormOptions = formOptions({
  defaultValues: {
    amount: "",
    color: AccountTypeColors.checking,
    currency: "USD",
    name: "",
    type: "checking",
  } as AccountFormValues,
});

export function useAccountForm() {
  const createAccount = useCreateAccount();

  return useForm({
    ...accountFormOptions,
    onSubmit: async ({ value }) => {
      const trimmedName = value.name.trim();

      try {
        await createAccount.mutateAsync({
          color: value.color,
          currency: value.currency,
          excludeFromTotal: false,
          icon: ACCOUNT_TYPE_META[value.type].systemIcon,
          initialBalance: decimalStringToCents(value.amount),
          name: trimmedName,
          sortOrder: 0,
          type: value.type,
        });
      } catch {}
    },
  });
}

export type UseAccountFormReturn = ReturnType<typeof useAccountForm>;
