import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSession } from "@/features/auth/use-session";
import { AuthScreen } from "@/features/auth/auth-screen";
import { colors } from "@/ui/design-tokens";
import { AuthenticatedApp } from "./authenticated-app";

export const SessionGate = () => {
  const { status, principal } = useSession();
  if (status === "loading")
    return (
      <View style={styles.loading}>
        <ActivityIndicator accessibilityLabel="Loading your session" />
      </View>
    );
  if (!principal || status === "signed_out") return <AuthScreen />;
  const identityKey =
    principal.kind === "user" ? `user:${principal.userId}` : `guest:${principal.guestSessionId}`;
  return <AuthenticatedApp key={identityKey} identityKey={identityKey} />;
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
