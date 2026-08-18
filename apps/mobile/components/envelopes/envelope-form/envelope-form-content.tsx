import { View } from "react-native";

import { EnvelopeAppearanceFields } from "@/components/envelopes/envelope-form/envelope-appearance-fields";
import { EnvelopeCategoryFields } from "@/components/envelopes/envelope-form/envelope-category-fields";
import { EnvelopeIdentityFields } from "@/components/envelopes/envelope-form/envelope-identity-fields";
import { EnvelopeSettingsFields } from "@/components/envelopes/envelope-form/envelope-settings-fields";
import type { EnvelopeCategoryOption } from "@/modules/budgeting/budgeting";

import type { UseEnvelopeFormReturn } from "./form";

interface EnvelopeFormContentProps {
  currency: string;
  envelopeId?: string;
  form: UseEnvelopeFormReturn;
  maximumSortOrder: number;
  options: readonly EnvelopeCategoryOption[];
}

export function EnvelopeFormContent({
  currency,
  envelopeId,
  form,
  maximumSortOrder,
  options,
}: EnvelopeFormContentProps) {
  return (
    <View className="gap-5">
      <EnvelopeIdentityFields currency={currency} form={form} />
      <EnvelopeAppearanceFields form={form} />
      <EnvelopeCategoryFields envelopeId={envelopeId} form={form} options={options} />
      <EnvelopeSettingsFields form={form} maximumSortOrder={maximumSortOrder} />
    </View>
  );
}
