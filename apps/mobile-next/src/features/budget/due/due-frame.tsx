import type { ReactNode } from "react";
import { View } from "react-native";

import { Screen } from "@/ui/trove";

import { DueHeader } from "./due-header";
import { dueLayout } from "./due-layout";

/** The Due screen before its list can show: header, then a loading, error or empty state. */
export function DueFrame({ children }: { readonly children: ReactNode }) {
  return (
    <Screen style={dueLayout.screen}>
      <View style={dueLayout.content}>
        <DueHeader />
        {children}
      </View>
    </Screen>
  );
}
