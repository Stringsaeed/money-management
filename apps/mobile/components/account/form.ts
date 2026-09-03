import { formOptions, useForm } from "@tanstack/react-form";

import { AccountTypeColors } from "@/constants/theme";
import { useCreateAccount, useUpdateAccount } from "@/hooks/use-accounts";
import type { Account, AccountType } from "@/types";
import { decimalStringToCents } from "@/utils/currency";

import { ACCOUNT_TYPE_META } from "./account-form-options";
import { accountDisplayIcon } from "./utils";

export interface AccountFormValues {
  amount: string;
  color: string;
  currency: string;
  icon: string;
  name: string;
  type: AccountType;
}

export const accountFormOptions = formOptions({
  defaultValues: {
    amount: "",
    color: AccountTypeColors.checking,
    currency: "USD",
    icon: ACCOUNT_TYPE_META.checking.emoji,
    name: "",
    type: "checking",
  } as AccountFormValues,
});

interface UseAccountFormArgs {
  onCreated?: VoidFunction;
  onError?: (message: string) => void;
}

interface UseEditAccountFormArgs {
  account: Account;
  onError?: (message: string) => void;
  onUpdated?: VoidFunction;
}

export function useAccountForm({ onCreated, onError }: UseAccountFormArgs = {}) {
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
          icon: value.icon,
          initialBalance: decimalStringToCents(value.amount),
          name: trimmedName,
          sortOrder: 0,
          type: value.type,
        });
        onCreated?.();
      } catch {
        // The form stays open so the user can retry. Callers that render an
        // error slot opt in via onError; the sheet relies on the mutation's
        // own error state instead.
        onError?.("Could not create the account. Please try again.");
      }
    },
  });
}

export type UseAccountFormReturn = ReturnType<typeof useAccountForm>;

export function useEditAccountForm({ account, onError, onUpdated }: UseEditAccountFormArgs) {
  const updateAccount = useUpdateAccount();
  const local = updateAccount.source === "local";

  return useForm({
    ...accountFormOptions,
    defaultValues: {
      amount: "",
      color: account.color,
      currency: account.currency,
      icon: accountDisplayIcon(account),
      name: account.name,
      type: account.type,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateAccount.mutateAsync({
          id: account.id,
          data: {
            color: value.color,
            icon: value.icon,
            name: value.name.trim(),
            ...(local && { currency: value.currency, type: value.type }),
          },
        });
        onUpdated?.();
      } catch {
        onError?.("Failed to update account.");
      }
    },
  });
}

type UseEditAccountFormReturn = ReturnType<typeof useEditAccountForm>;
export type AccountFormApi = UseAccountFormReturn | UseEditAccountFormReturn;
