import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

import { redeemMagicToken } from "./actions";
import { parseAuthLink, parseAuthLinkFailure } from "./links";
import { hrefForInternal, PROFILE_HOUSEHOLD_HREF, returnTo } from "./return-to";
import { useAccess } from "./use-access";

type GateStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "redeeming" }
  | { readonly kind: "unusable" }
  | { readonly kind: "offline" };

export function AuthLinkGate() {
  const access = useAccess();
  const [status, setStatus] = useState<GateStatus>({ kind: "idle" });

  useEffect(() => {
    let cancelled = false;

    async function consume(url: string | null) {
      if (!url) return;
      const next = await redeemUrl(url);
      if (cancelled || next.kind === "ignored") return;
      setStatus(next);
    }

    void Linking.getInitialURL().then(consume);
    const subscription = Linking.addEventListener("url", (event) => {
      void consume(event.url);
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

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-surface px-6">
      <Text className="font-heading-medium italic text-3xl text-ink">
        {status.kind === "offline" ? "You're offline" : "This link isn't usable"}
      </Text>
      <Text className="mt-3 text-center font-body-normal text-base text-ink/55">
        {status.kind === "offline"
          ? "Check your connection and open the email link again."
          : "It may have expired or already been used. Request a fresh one."}
      </Text>
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
        <Text className="font-body-semibold text-white">Request a new link</Text>
      </Button>
    </View>
  );
}

async function redeemUrl(url: string): Promise<GateStatus | { readonly kind: "ignored" }> {
  if (parseAuthLinkFailure(url)) return { kind: "unusable" };
  const grant = parseAuthLink(url);
  if (!grant) return { kind: "ignored" };
  if (grant.kind === "reset_token") {
    router.push({ pathname: "/(auth)/reset-password", params: { token: grant.token } });
    return { kind: "ignored" };
  }
  const outcome = await redeemMagicToken(grant.token);
  if (outcome.kind === "signed_in") {
    router.replace(hrefForInternal(PROFILE_HOUSEHOLD_HREF));
    return { kind: "idle" };
  }
  if (outcome.kind === "offline") return { kind: "offline" };
  return { kind: "unusable" };
}
