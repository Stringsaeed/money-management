import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { redeemMagicToken } from "./actions";
import { logAuthLink, summarizeToken } from "./auth-link-debug";
import type { PresentAuthSheetInput } from "./auth-sheet-session";
import { isAuthCarrierPath, parseAuthLink, parseAuthLinkFailure } from "./links";
import { hrefForInternal, PROFILE_HOUSEHOLD_HREF, returnTo } from "./return-to";
import { useAccess } from "./use-access";
import { usePresentAuthSheet } from "./use-auth-sheet";

type GateStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "redeeming" }
  | { readonly kind: "unusable" }
  | { readonly kind: "no_account" }
  | { readonly kind: "offline" };

/** Survives AuthLinkGate remounts (access resolving / Fast Refresh). */
const consumedAuthTokens = new Set<string>();

export function resetConsumedAuthTokensForTests() {
  consumedAuthTokens.clear();
}

export function AuthLinkGate() {
  const access = useAccess();
  const presentAuthSheet = usePresentAuthSheet();
  const presentAuthSheetRef = useRef(presentAuthSheet);
  presentAuthSheetRef.current = presentAuthSheet;
  const [status, setStatus] = useState<GateStatus>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function consume(url: string | null, source: "initial" | "event") {
      logAuthLink("gate.consume", { source, url: url ?? "null" });
      if (!url || cancelled) {
        logAuthLink("gate.skip", { source, reason: !url ? "empty_url" : "cancelled" });
        return;
      }
      if (shouldSkipConsumedGrant(url, source)) return;
      await applyRedeem(url, source);
    }

    async function applyRedeem(url: string, source: "initial" | "event") {
      const isAuthCarrier = isAuthCarrierPath(url);
      if (isAuthCarrier) setStatus({ kind: "redeeming" });
      const next = await redeemUrl(url, presentAuthSheetRef.current);
      logAuthLink("gate.outcome", {
        source,
        status: next.kind,
        carrier: isAuthCarrier ? "true" : "false",
      });
      if (cancelled) {
        logAuthLink("gate.skip", { source, reason: "cancelled_after_redeem" });
        return;
      }
      if (next.kind === "ignored") {
        if (isAuthCarrier) setStatus({ kind: "idle" });
        return;
      }
      setStatus(next);
    }

    void Linking.getInitialURL().then((url) => consume(url, "initial"));
    const subscription = Linking.addEventListener("url", (event) => {
      void consume(event.url, "event");
    });
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  if (status.kind === "idle") return null;

  if (status.kind === "redeeming") {
    return (
      <View className="absolute inset-0 z-50 items-center justify-center bg-surface/95 px-6">
        <ActivityIndicator size="large" />
        <Text className="mt-4 font-body-medium text-sm text-ink/60">Signing you in… ✨</Text>
      </View>
    );
  }

  const copy = gateCopy(status.kind);
  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-surface px-6">
      <Text className="font-heading-medium italic text-3xl text-ink">{copy.title}</Text>
      <Text className="mt-3 text-center font-body-normal text-base text-ink/55">{copy.body}</Text>
      <Button
        className="mt-6"
        onPress={() => {
          setStatus({ kind: "idle" });
          if (access.kind === "anonymous") access.beginAuth(returnTo.profileHousehold());
          if (access.kind === "session_revoked") {
            access.reauthenticate(returnTo.profileHousehold());
          }
        }}
      >
        <Text className="font-body-semibold text-white">{copy.action}</Text>
      </Button>
    </View>
  );
}

async function redeemUrl(
  url: string,
  presentAuthSheet: (input: PresentAuthSheetInput) => void,
): Promise<GateStatus | { readonly kind: "ignored" }> {
  if (parseAuthLinkFailure(url)) return { kind: "unusable" };
  const grant = parseAuthLink(url);
  if (!grant) return { kind: "ignored" };
  if (grant.kind === "reset_token") {
    presentAuthSheet({
      target: returnTo.profileHousehold(),
      grant: { token: grant.token },
    });
    return { kind: "ignored" };
  }
  const outcome = await redeemMagicToken(grant.token);
  if (outcome.kind === "signed_in") {
    router.replace(hrefForInternal(PROFILE_HOUSEHOLD_HREF));
    return { kind: "idle" };
  }
  if (outcome.kind === "offline") return { kind: "offline" };
  if (outcome.kind === "no_account") return { kind: "no_account" };
  return { kind: "unusable" };
}

function shouldSkipConsumedGrant(url: string, source: "initial" | "event"): boolean {
  const grant = parseAuthLink(url);
  logAuthLink("gate.parsed", {
    source,
    grant: grant?.kind ?? "null",
    token: grant ? summarizeToken(grant.token) : "none",
    failure: parseAuthLinkFailure(url) ?? "none",
  });
  if (grant && consumedAuthTokens.has(grant.token)) {
    logAuthLink("gate.dedupe", { source, token: summarizeToken(grant.token) });
    return true;
  }
  if (grant) consumedAuthTokens.add(grant.token);
  return false;
}

type GateCopy = {
  readonly title: string;
  readonly body: string;
  readonly action: string;
};

function gateCopy(kind: "unusable" | "no_account" | "offline"): GateCopy {
  if (kind === "offline") {
    return {
      title: "You're offline",
      body: "Check your connection and open the email link again.",
      action: "Request a new link",
    };
  }
  if (kind === "no_account") {
    return {
      title: "No account yet",
      body: "Magic links only work after you create a profile. Create one with a password, then request a fresh link.",
      action: "Create a profile",
    };
  }
  return {
    title: "This link isn't usable",
    body: "It may have expired or already been used. Request a fresh one.",
    action: "Request a new link",
  };
}
