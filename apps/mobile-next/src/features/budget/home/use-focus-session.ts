import { useFocusEffect } from "expo-router";
import { useState } from "react";

/** Counts how many times the screen has gained focus: 0 before the first focus, then 1, 2, ... */
export function useFocusSession(): number {
  const [session, setSession] = useState(0);
  useFocusEffect(() => {
    setSession((current) => current + 1);
  });
  return session;
}
