import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";

export function Host({ children }: PropsWithChildren) {
  return <View>{children}</View>;
}

export function BottomSheet({
  children,
  isPresented,
}: PropsWithChildren<{ isPresented: boolean }>) {
  return isPresented ? <View>{children}</View> : null;
}

export function BottomSheetView({ children }: PropsWithChildren) {
  return <View>{children}</View>;
}

export function BottomSheetScrollView({ children, ...props }: PropsWithChildren) {
  return <ScrollView {...props}>{children}</ScrollView>;
}
