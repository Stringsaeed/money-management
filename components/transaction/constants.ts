import { LinearTransition } from "react-native-reanimated";

export const INK = "#1C1B1A";
export const INK_MUTED = "#1C1B1A66";
export const SURFACE_CONTAINER = "#F1F0EE";

export const SHEET_BG = { backgroundColor: "#F9F8F6" };
export const SHEET_HANDLE = { backgroundColor: "#EBE8E3" };

export const layoutTransition = LinearTransition.springify().damping(20).stiffness(150);
