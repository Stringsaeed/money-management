import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach } from "@jest/globals";
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react-native";
import type { ReactElement, ReactNode } from "react";

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
}

const TestProviders = ({ children, client }: TestProvidersProps) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { client?: QueryClient },
) => {
  const client = options?.client ?? createTestQueryClient();
  trackedClients.add(client);

  return {
    client,
    ...render(ui, {
      ...options,
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    }),
  };
};

export const renderHookWithProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & { client?: QueryClient },
) => {
  const client = options?.client ?? createTestQueryClient();
  trackedClients.add(client);

  return {
    client,
    ...renderHook(hook, {
      ...options,
      wrapper: ({ children }) => <TestProviders client={client}>{children}</TestProviders>,
    }),
  };
};
