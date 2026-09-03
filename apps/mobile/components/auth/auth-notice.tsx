import { Text } from "@/components/ui/text";
import { noticeCopy } from "@/modules/auth-journey";
import type { Notice } from "@/modules/auth-journey";

export function AuthNotice({ notice }: { readonly notice: Notice | null }) {
  if (!notice) return null;
  const destructive = notice.kind !== "link_sent";
  return (
    <Text
      className={destructive ? "text-destructive text-sm" : "font-body-medium text-sm text-sage"}
    >
      {noticeCopy(notice)}
    </Text>
  );
}
