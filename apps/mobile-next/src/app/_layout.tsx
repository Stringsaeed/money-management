import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Nunito_200ExtraLight,
  Nunito_300Light,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
} from "@expo-google-fonts/ibm-plex-mono";
import { disableDevMenu } from "@/dev/disable-dev-menu";
import { hydrateAiPreferences } from "@/features/ai";
import { AuthProvider } from "@/features/auth/auth-provider";
import { hydrateSoundPreferences } from "@/features/sound";
import { SessionGate } from "@/navigation/session-gate";
import { colors } from "@/ui/design-tokens";
import { ToastHost } from "@/ui/toast";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
void disableDevMenu();
void hydrateSoundPreferences();
void hydrateAiPreferences();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_200ExtraLight,
    Nunito_300Light,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
  });
  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    disableDevMenu();
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <SessionGate />
        </AuthProvider>
        <ToastHost />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.background } });
