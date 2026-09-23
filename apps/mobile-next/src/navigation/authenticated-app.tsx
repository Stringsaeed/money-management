import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQueryAppFocus } from "@/data/use-query-app-focus";
import { LedgerScopeProvider } from "./ledger-scope-provider";
import { DataNavigator } from "./data-navigator";

export const AuthenticatedApp = ({ identityKey }: { readonly identityKey: string }) => {
  useQueryAppFocus();
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } }),
  );
  useEffect(
    () => () => {
      queryClient.clear();
    },
    [queryClient],
  );
  return (
    <QueryClientProvider client={queryClient}>
      <LedgerScopeProvider>
        <DataNavigator queryClient={queryClient} identityKey={identityKey} />
      </LedgerScopeProvider>
    </QueryClientProvider>
  );
};
