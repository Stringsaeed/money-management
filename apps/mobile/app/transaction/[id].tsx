import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { getRecurringRuleAppearance } from "@/components/recurring/recurring-rule-appearance";
import {
  presentRecurringPreview,
  recurringChangeFailureMessage,
} from "@/components/recurring/recurring-change-feedback";
import { RecurringRuleWarning } from "@/components/recurring/recurring-rule-warning";
import { toRecurringRuleDraft } from "@/components/transaction/recurrence/to-recurring-rule";
import {
  existingTransactionHeaderItems,
  newTransactionHeaderItems,
  recurringRuleHeaderItems,
} from "@/components/transaction/transaction-screen-header-items";
import { getTransactionScreenInitialData } from "@/components/transaction/transaction-screen-initial-data";
import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import type { TransactionFormHandle } from "@/components/transaction/types";
import { useAllCategories } from "@/hooks/use-categories";
import {
  useArchiveRecurringRule,
  useCreateRecurringRule,
  useEditRecurringRule,
  usePauseRecurringRule,
  useRecurringRule,
  useRepairRecurringRule,
  useRestoreRecurringRule,
  useResumeRecurringRule,
} from "@/hooks/use-recurring-rules";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransaction,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import type { RecurringChangeResult } from "@/modules/recurring-rules";
import { getSystemTimeZone } from "@/modules/recurring-rules/clock";
import { toDateString } from "@/utils/date";

const NEW_ID = "new";

type LifecycleAction = "pause" | "resume" | "archive" | "restore";

export default function TransactionScreen() {
  const router = useRouter();
  const { id, recurring } = useLocalSearchParams<{ id: string; recurring?: string }>();
  const isNew = id === NEW_ID;
  const isRuleEditor = !isNew && recurring === "true";

  const formRef = useRef<TransactionFormHandle | null>(null);
  const [isRecurring, setIsRecurring] = useState(recurring === "true");

  const { data: categories = [] } = useAllCategories();
  const { data: transaction, isLoading: isTransactionLoading } = useTransaction(
    isNew || isRuleEditor ? undefined : id,
  );
  const { data: rule, isLoading: isRuleLoading } = useRecurringRule(isRuleEditor ? id : undefined);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createRule = useCreateRecurringRule();
  const editRule = useEditRecurringRule();
  const repairRule = useRepairRecurringRule();
  const pauseRule = usePauseRecurringRule();
  const resumeRule = useResumeRecurringRule();
  const archiveRule = useArchiveRecurringRule();
  const restoreRule = useRestoreRecurringRule();

  const isLoading = isRuleEditor ? isRuleLoading : isTransactionLoading;
  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }
  if (isRuleEditor ? !rule : !isNew && !transaction) return null;

  async function handleSubmit(data: TransactionFormData, confirmationToken?: string) {
    if (isRuleEditor || (isNew && isRecurring)) {
      await submitRecurringRule(data, confirmationToken);
      return;
    }
    if (isNew) {
      await createTransaction.mutateAsync({
        ...data,
        date: toDateString(data.date),
        isRecurring: false,
        recurringRuleId: null,
      });
    } else {
      await updateTransaction.mutateAsync({
        id,
        data: { ...data, date: toDateString(data.date) },
      });
    }
    finishNavigation();
  }

  async function submitRecurringRule(data: TransactionFormData, confirmationToken?: string) {
    const draft = toRecurringRuleDraft(data, categories, rule?.timeZone ?? getSystemTimeZone());
    const result = isRuleEditor
      ? rule?.health === "needs_attention"
        ? await repairRule.mutateAsync({
            ruleId: id,
            expectedRevision: rule.revision,
            rule: draft,
            confirmationToken,
          })
        : await editRule.mutateAsync({
            ruleId: id,
            expectedRevision: rule!.revision,
            rule: draft,
            confirmationToken,
          })
      : await createRule.mutateAsync({ rule: draft, confirmationToken });

    if (result.kind === "preview_required") {
      presentRecurringPreview(result, {
        title: isRuleEditor ? "Apply this Rule change?" : "Create overdue transactions?",
        confirmLabel: isRuleEditor ? "Apply Change" : "Create Rule",
        onConfirm: () => submitRecurringRule(data, result.confirmationToken),
      });
      return;
    }
    if (result.kind !== "applied") throw new Error(recurringChangeFailureMessage(result));
    finishNavigation();
  }

  async function changeLifecycle(action: LifecycleAction, confirmationToken?: string) {
    if (!rule) return;
    const variables = { ruleId: rule.id, expectedRevision: rule.revision };
    const result = await lifecycleMutation(action, variables, confirmationToken);

    if (result.kind === "preview_required") {
      presentRecurringPreview(result, {
        title: action === "archive" ? "Archive after settling?" : "Pause after settling?",
        confirmLabel: action === "archive" ? "Archive Rule" : "Pause Rule",
        onConfirm: () => changeLifecycle(action, result.confirmationToken),
      });
      return;
    }
    if (result.kind !== "applied") {
      Alert.alert("Couldn't Update Rule", recurringChangeFailureMessage(result));
      return;
    }
    if (action === "archive") finishNavigation();
  }

  function lifecycleMutation(
    action: LifecycleAction,
    variables: { ruleId: string; expectedRevision: number },
    confirmationToken?: string,
  ): Promise<RecurringChangeResult> {
    if (action === "pause") return pauseRule.mutateAsync({ ...variables, confirmationToken });
    if (action === "resume") return resumeRule.mutateAsync(variables);
    if (action === "archive") return archiveRule.mutateAsync({ ...variables, confirmationToken });
    return restoreRule.mutateAsync(variables);
  }

  function confirmArchive() {
    Alert.alert(
      "Archive Recurring Rule?",
      "Future dates will be skipped. Generated transactions and Rule history are kept.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => {
            void changeLifecycle("archive");
          },
        },
      ],
    );
  }

  function confirmDeleteTransaction() {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTransaction.mutateAsync(id);
            router.back();
          },
        },
      ],
    );
  }

  function finishNavigation() {
    if (router.canGoBack()) router.back();
    else if (router.canDismiss()) router.dismiss();
  }

  const onSave = () => formRef.current?.submit();
  const appearance = rule ? getRecurringRuleAppearance(rule) : undefined;
  const headerRightItems = isNew
    ? newTransactionHeaderItems({
        isRecurring,
        onSave,
        onToggleRecurring: () => setIsRecurring((current) => !current),
      })
    : rule && appearance
      ? recurringRuleHeaderItems({
          rule,
          iconTintColor: appearance.iconTintColor,
          onArchive: confirmArchive,
          onLifecycleChange: (action) => void changeLifecycle(action),
          onSave,
        })
      : existingTransactionHeaderItems({ onDelete: confirmDeleteTransaction, onSave });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "",
          headerBackButtonDisplayMode: "minimal",
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
      <TransactionForm
        initialData={getTransactionScreenInitialData(rule, transaction)}
        isRecurring={isRuleEditor || isRecurring}
        onSubmit={handleSubmit}
        formRef={formRef}
        bannerContent={
          rule?.health === "needs_attention" ? <RecurringRuleWarning rule={rule} /> : undefined
        }
        surfaceClassName={appearance?.surfaceClassName}
      />
    </>
  );
}
