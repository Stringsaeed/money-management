import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach } from "@jest/globals";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";

import {
  LedgerDataSourceProvider,
  type LedgerSourceSelection,
} from "@/modules/ledger-data-source/provider";

export type TestLedgerSourceSelection =
  | { readonly kind: "local" }
  | (Omit<Extract<LedgerSourceSelection, { kind: "synced" }>, "userId"> & {
      readonly userId?: string;
    });

const trackedClients = new Set<QueryClient>();

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

afterEach(() => {
  trackedClients.forEach((client) => {
    client.clear();
  });
  trackedClients.clear();
});

interface TestProvidersProps {
  children: ReactNode;
  client: QueryClient;
  ledgerSelection?: TestLedgerSourceSelection;
}

const TestProviders = ({ children, client, ledgerSelection }: TestProvidersProps) => {
  const selection: LedgerSourceSelection | undefined =
    ledgerSelection?.kind === "synced"
      ? { ...ledgerSelection, userId: ledgerSelection.userId ?? "test-user" }
      : ledgerSelection;
  return (
    <QueryClientProvider client={client}>
      <LedgerDataSourceProvider selection={selection}>{children}</LedgerDataSourceProvider>
    </QueryClientProvider>
  );
};

interface ProviderOptions {
  client?: QueryClient;
  ledgerSelection?: TestLedgerSourceSelection;
}

export const renderWithProviders = async (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & ProviderOptions,
) => {
  const client = options?.client ?? createTestQueryClient();
  const { client: _client, ledgerSelection: _ledgerSelection, ...renderOptions } = options ?? {};
  trackedClients.add(client);

  return {
    client,
    ...(await render(ui, {
      ...renderOptions,
      wrapper: ({ children }) => (
        <TestProviders client={client} ledgerSelection={options?.ledgerSelection}>
          {children}
        </TestProviders>
      ),
    })),
  };
};

export const renderHookWithProviders = async <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & ProviderOptions,
) => {
  const client = options?.client ?? createTestQueryClient();
  const { client: _client, ledgerSelection: _ledgerSelection, ...renderOptions } = options ?? {};
  trackedClients.add(client);

  return {
    client,
    ...(await renderHook(hook, {
      ...renderOptions,
      wrapper: ({ children }) => (
        <TestProviders client={client} ledgerSelection={options?.ledgerSelection}>
          {children}
        </TestProviders>
      ),
    })),
  };
};
