import type { NativeStackHeaderItem } from "expo-router/build/react-navigation/native-stack";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, type MutableRefObject } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import {
  presentRecurringPreview,
  recurringChangeFailureMessage,
} from "@/components/recurring/recurring-change-feedback";
import { RecurringRuleStatus } from "@/components/recurring/recurring-rule-status";
import { toRecurringRuleDraft } from "@/components/transaction/recurrence/to-recurring-rule";
import {
  TransactionForm,
  type TransactionFormData,
} from "@/components/transaction/transaction-form";
import type { TransactionFormHandle } from "@/components/transaction/types";
import { useCategories } from "@/hooks/use-categories";
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
import type { RecurringRuleLifecycle } from "@/modules/recurring-rules";
import { getSystemTimeZone } from "@/modules/recurring-rules/clock";
import { parseDate } from "@/utils/date";

const NEW_ID = "new";

export default function RecurringScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === NEW_ID;
  const formRef = useRef<TransactionFormHandle | null>(null);

  const { data: categories = [] } = useCategories();
  const { data: rule, isLoading } = useRecurringRule(isNew ? undefined : id);
  const createRule = useCreateRecurringRule();
  const editRule = useEditRecurringRule();
  const repairRule = useRepairRecurringRule();
  const pauseRule = usePauseRecurringRule();
  const resumeRule = useResumeRecurringRule();
  const archiveRule = useArchiveRecurringRule();
  const restoreRule = useRestoreRecurringRule();

  if (!isNew && isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator />
      </View>
    );
  }
  if (!isNew && !rule) return null;

  async function handleSubmit(data: TransactionFormData, confirmationToken?: string) {
    const draft = toRecurringRuleDraft(data, categories, rule?.timeZone ?? getSystemTimeZone());
    const result = isNew
      ? await createRule.mutateAsync({ rule: draft, confirmationToken })
      : rule?.health === "needs_attention"
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
          });

    if (result.kind === "preview_required") {
      presentRecurringPreview(result, {
        title: isNew ? "Create overdue transactions?" : "Apply this Rule change?",
        confirmLabel: isNew ? "Create Rule" : "Apply Change",
        onConfirm: () => handleSubmit(data, result.confirmationToken),
      });
      return;
    }
    if (result.kind !== "applied") throw new Error(recurringChangeFailureMessage(result));
    finishNavigation();
  }

  async function changeLifecycle(
    lifecycle: "pause" | "resume" | "archive" | "restore",
    confirmationToken?: string,
  ) {
    if (!rule) return;
    const variables = { ruleId: rule.id, expectedRevision: rule.revision };
    const result = await (lifecycle === "pause"
      ? pauseRule.mutateAsync({ ...variables, confirmationToken })
      : lifecycle === "resume"
        ? resumeRule.mutateAsync(variables)
        : lifecycle === "archive"
          ? archiveRule.mutateAsync({ ...variables, confirmationToken })
          : restoreRule.mutateAsync(variables));

    if (result.kind === "preview_required") {
      presentRecurringPreview(result, {
        title: lifecycle === "archive" ? "Archive after settling?" : "Pause after settling?",
        confirmLabel: lifecycle === "archive" ? "Archive Rule" : "Pause Rule",
        onConfirm: () => changeLifecycle(lifecycle, result.confirmationToken),
      });
      return;
    }
    if (result.kind !== "applied") {
      Alert.alert("Couldn't Update Rule", recurringChangeFailureMessage(result));
      return;
    }
    if (lifecycle === "archive") finishNavigation();
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

  function finishNavigation() {
    if (router.canGoBack()) router.back();
    else if (router.canDismiss()) router.dismiss();
  }

  const headerRightItems = isNew
    ? newRuleHeaderItems(formRef)
    : existingRuleHeaderItems(rule!.lifecycle, formRef, changeLifecycle, confirmArchive);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: isNew ? "New Recurring Rule" : "Recurring Rule",
          headerBackButtonDisplayMode: "minimal",
          unstable_headerRightItems: () => headerRightItems,
        }}
      />
      <TransactionForm
        initialData={
          rule
            ? {
                type: rule.type,
                amount: rule.amountMinor ?? 0,
                accountId: rule.accountId ?? undefined,
                toAccountId: rule.toAccountId,
                categoryId: rule.categoryId,
                isRecurring: true,
                description: rule.description,
                date: parseDate(rule.startDate),
                currency: rule.currency,
                originalAmount: null,
                originalCurrency: null,
                exchangeRate: null,
                recurrence: {
                  frequency: rule.frequency,
                  intervalCount: rule.intervalCount,
                  endDate: rule.endDate ? parseDate(rule.endDate) : null,
                  endCount: rule.endCount,
                },
              }
            : undefined
        }
        isRecurring
        onSubmit={handleSubmit}
        formRef={formRef}
        statusContent={rule ? <RecurringRuleStatus rule={rule} /> : undefined}
      />
    </>
  );
}

function newRuleHeaderItems(
  formRef: MutableRefObject<TransactionFormHandle | null>,
): NativeStackHeaderItem[] {
  return [
    {
      label: "save",
      type: "button",
      onPress: () => formRef.current?.submit(),
      icon: { type: "sfSymbol", name: "checkmark" },
    },
  ];
}

function existingRuleHeaderItems(
  lifecycle: RecurringRuleLifecycle,
  formRef: MutableRefObject<TransactionFormHandle | null>,
  changeLifecycle: (lifecycle: "pause" | "resume" | "archive" | "restore") => Promise<void>,
  confirmArchive: VoidFunction,
): NativeStackHeaderItem[] {
  const lifecycleItem: NativeStackHeaderItem | null =
    lifecycle === "active"
      ? {
          label: "pause",
          type: "button",
          onPress: () => void changeLifecycle("pause"),
          icon: { type: "sfSymbol", name: "pause.circle" },
        }
      : lifecycle === "paused"
        ? {
            label: "resume",
            type: "button",
            onPress: () => void changeLifecycle("resume"),
            icon: { type: "sfSymbol", name: "play.circle" },
          }
        : lifecycle === "archived"
          ? {
              label: "restore",
              type: "button",
              onPress: () => void changeLifecycle("restore"),
              icon: { type: "sfSymbol", name: "arrow.uturn.backward.circle" },
            }
          : null;
  const archiveItem: NativeStackHeaderItem | null =
    lifecycle === "archived"
      ? null
      : {
          label: "archive",
          type: "button",
          onPress: confirmArchive,
          icon: { type: "sfSymbol", name: "archivebox" },
          tintColor: "#B48A7B",
        };
  const items: NativeStackHeaderItem[] = [];
  if (lifecycleItem) items.push(lifecycleItem);
  if (archiveItem) items.push(archiveItem);
  items.push({
    label: "save",
    type: "button",
    onPress: () => formRef.current?.submit(),
    icon: { type: "sfSymbol", name: "checkmark" },
  });
  return items;
}
