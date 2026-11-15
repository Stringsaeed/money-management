import { useState } from "react";
import { Alert } from "react-native";

import { profileIdentity, useSession } from "@/features/auth";

/** Who is signed in, plus signing out (guests confirm first) and saving a guest ledger. */
export function useSessionActions() {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const identity = profileIdentity(session.status, session.principal);

  const endSession = () => {
    setBusy(true);
    void session
      .signOut()
      .catch(() =>
        Alert.alert(
          "Could not finish signing out",
          "Reopen the app to check your session and try again.",
        ),
      )
      .finally(() => setBusy(false));
  };

  const signOut = () => {
    if (!identity.isGuest) {
      endSession();
      return;
    }
    Alert.alert(
      "End this guest session?",
      "You will lose access to this guest ledger. Save it to an account first if you want to keep it.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End session", style: "destructive", onPress: endSession },
      ],
    );
  };

  const saveGuest = () => {
    setBusy(true);
    void session.saveGuestToAccount().finally(() => setBusy(false));
  };

  return { ...identity, busy, error: session.error, signOut, saveGuest };
}
