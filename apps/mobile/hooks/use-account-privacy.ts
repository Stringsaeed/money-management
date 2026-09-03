import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAccountDataSource } from "@/modules/ledger-data-source/coordinator";
import { accountKeys, cohereLedgerCache } from "@/modules/ledger-cache";

export function useAccountPrivacyState(id: string) {
  const source = useAccountDataSource();
  return useQuery({
    queryKey: [...accountKeys.privacy(id), source.cacheKey],
    enabled: source.accountPrivacy.kind === "synced",
    queryFn: () =>
      source.accountPrivacy.kind === "synced" ? source.accountPrivacy.read(id) : undefined,
  });
}

export function useSetAccountPrivacy(id: string) {
  const source = useAccountDataSource();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isPrivate: boolean) => {
      if (source.accountPrivacy.kind !== "synced") {
        throw new Error(source.accountPrivacy.reason);
      }
      return source.accountPrivacy.set(id, isPrivate ? "private" : "public");
    },
    onSuccess: () => cohereLedgerCache(queryClient, { kind: "account.updated", id }),
  });
}
