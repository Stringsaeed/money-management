import { useLocalSearchParams } from "expo-router";
import { z } from "zod";

const currencyParam = z.string().min(1);

/**
 * The currency of an additional budget's setup (it travels in the route), or `null` while setting
 * up the first budget, whose currency is a choice inside setup.
 */
export function useSetupTarget(): string | null {
  const { currency } = useLocalSearchParams<{ currency?: string }>();
  const parsed = currencyParam.safeParse(currency);
  return parsed.success ? parsed.data : null;
}
