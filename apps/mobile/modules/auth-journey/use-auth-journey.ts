import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  coreFromAccess,
  hrefForInternal,
  resolveReturnDestination,
  useAccess,
  type ReturnTo,
} from "@/modules/access";

import { runEffect } from "./commands";
import { initialChoosePasswordState, initialIdentifyState, reduce } from "./journey";
import type { JourneyEvent, JourneyState, ResetGrant } from "./types";

export interface AuthJourneyController {
  readonly state: JourneyState;
  readonly send: (event: JourneyEvent) => void;
}

export function useAuthJourney(
  target: ReturnTo,
  seed?: { readonly grant?: ResetGrant; readonly email?: string },
): AuthJourneyController {
  const access = useAccess();
  const [state, setState] = useState<JourneyState>(() =>
    seed?.grant
      ? initialChoosePasswordState(seed.grant, seed.email ?? "")
      : initialIdentifyState(seed?.email ?? ""),
  );

  useEffect(() => {
    if (state.step !== "established") return;
    router.replace(hrefForInternal(resolveReturnDestination(coreFromAccess(access), target)));
  }, [access, state.step, target]);

  function send(event: JourneyEvent) {
    setState((current) => {
      const result = reduce(current, event, new Date());
      if (result.effect) {
        void runEffect(result.effect).then((next) => {
          setState((after) => reduce(after, next, new Date()).state);
        });
      }
      return result.state;
    });
  }

  return { state, send };
}
