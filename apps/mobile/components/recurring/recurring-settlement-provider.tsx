import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import { cohereRecurringEffects } from "@/modules/ledger-cache";
import { RecurringSettlementError, type SettlementReport } from "@/modules/recurring-rules";
import { useRecurringRulesModule } from "@/modules/recurring-rules/provider";

interface RecurringSettlementFeedback {
  report: SettlementReport | null;
  error: Error | null;
  dismiss(): void;
  retry(): Promise<void>;
}

const RecurringSettlementContext = createContext<RecurringSettlementFeedback | null>(null);

export function RecurringSettlementProvider({ children }: PropsWithChildren) {
  const recurringRules = useRecurringRulesModule();
  const queryClient = useQueryClient();
  const [report, setReport] = useState<SettlementReport | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const settle = async () => {
    try {
      const nextReport = await recurringRules.settle();
      await cohereRecurringEffects(queryClient, nextReport.effects);
      if (!mounted.current) return;
      setReport(nextReport);
      setError(null);
    } catch (cause) {
      const nextError = cause instanceof Error ? cause : new Error("Recurring Settlement failed.");
      if (cause instanceof RecurringSettlementError) {
        await cohereRecurringEffects(queryClient, cause.report.effects);
        if (!mounted.current) return;
        setReport(cause.report);
      }
      if (!mounted.current) return;
      setError(nextError);
    }
  };
  const settleInEffect = useEffectEvent(settle);

  useEffect(() => {
    mounted.current = true;
    let previousState = AppState.currentState;
    const run = async () => {
      if (!mounted.current) return;
      await settleInEffect();
    };

    void run();
    const subscription = AppState.addEventListener("change", (nextState) => {
      const returnedToForeground = previousState !== "active" && nextState === "active";
      previousState = nextState;
      if (returnedToForeground) void run();
    });
    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, []);

  return (
    <RecurringSettlementContext
      value={{
        report,
        error,
        dismiss: () => {
          setReport(null);
          setError(null);
        },
        retry: settle,
      }}
    >
      {children}
    </RecurringSettlementContext>
  );
}

export function useRecurringSettlementFeedback(): RecurringSettlementFeedback {
  const feedback = use(RecurringSettlementContext);
  if (!feedback) {
    throw new Error(
      "useRecurringSettlementFeedback must be used inside RecurringSettlementProvider.",
    );
  }
  return feedback;
}
