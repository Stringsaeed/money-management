import { useState } from "react";
import { Alert, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { inputTextStyle } from "@/components/ui/input-style";
import { Text } from "@/components/ui/text";
import { useAcceptInvite } from "@/hooks/use-households";
import { isValidInviteCodeFormat, normalizeInviteCode } from "@/utils/invite-code";

/** Joins an existing household by typing the owner's invite code. */
export function JoinHouseholdForm() {
  const [code, setCode] = useState("");
  const acceptInvite = useAcceptInvite();
  const normalized = normalizeInviteCode(code);
  const formatValid = isValidInviteCodeFormat(normalized);

  async function handleJoin() {
    try {
      await acceptInvite.mutateAsync(normalized);
      setCode("");
      Alert.alert("Welcome! 🎉", "You've joined the household.");
    } catch {
      // Rejection reasons are surfaced below.
    }
  }

  return (
    <View className="gap-3 px-4 py-4">
      <Text className="font-body-normal text-xs text-ink/40">
        Got a code from a family member? Enter it to join their household.
      </Text>
      <TextInput
        placeholder="Invite code (e.g. ABCD2345)"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholderTextColor="#9a9896"
        className="border border-input rounded-[10px] p-3.5 text-base leading-5 tracking-widest uppercase text-foreground"
        style={inputTextStyle}
      />
      <Button onPress={handleJoin} disabled={!formatValid || acceptInvite.isPending}>
        <Text className="font-body-semibold text-white">
          {acceptInvite.isPending ? "Joining…" : "🤝 Join household"}
        </Text>
      </Button>
      {acceptInvite.isError ? (
        <Text className="text-destructive text-xs">
          That code didn’t work — check for typos or ask for a fresh one.
        </Text>
      ) : null}
    </View>
  );
}
