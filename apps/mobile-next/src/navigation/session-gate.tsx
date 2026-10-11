import { StyleSheet, View } from "react-native";
import { useSession } from "@/features/auth/use-session";
import { AuthScreen } from "@/features/auth/auth-screen";
import { layout, radius, Screen, Skeleton, space } from "@/ui/trove";
import { AuthenticatedApp } from "./authenticated-app";

export const SessionGate = () => {
  const { status, principal } = useSession();
  if (status === "loading")
    return (
      <Screen style={styles.loading}>
        <View
          accessible
          accessibilityLabel="Loading your session"
          accessibilityState={{ busy: true }}
          style={styles.skeletons}
        >
          <Skeleton height={space[10]} width="60%" />
          <Skeleton borderRadius={radius.lg} height={space[16] + space[10]} />
        </View>
      </Screen>
    );
  if (!principal || status === "signed_out") return <AuthScreen />;
  const identityKey =
    principal.kind === "user" ? `user:${principal.userId}` : `guest:${principal.guestSessionId}`;
  return <AuthenticatedApp key={identityKey} identityKey={identityKey} />;
};

const styles = StyleSheet.create({
  loading: { paddingHorizontal: layout.screenGutter, paddingTop: space[6] },
  skeletons: { gap: space[4] },
});
