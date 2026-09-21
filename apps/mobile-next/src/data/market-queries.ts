import { useQuery } from "@tanstack/react-query";
import { marketResponseSchema, type MarketQuote } from "@trove/api/v2/market-contracts";
import { apiRequest } from "./http";

export type V2MarketQuote = MarketQuote;

export const useMarketQuotesQuery = () => {
  const query = useQuery({
    queryKey: ["v2", "market"],
    queryFn: () => apiRequest("/market", { schema: marketResponseSchema }),
    staleTime: 60_000,
    refetchInterval: 300_000,
    retry: 1,
  });
  return {
    data: query.data?.quotes ?? [],
    fetchedAt: query.data?.fetchedAt ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    retry: query.refetch,
  };
};
