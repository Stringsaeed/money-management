import { createContext } from "react";

import type { AppUpdateContextValue } from "./types";

export const AppUpdateContext = createContext<AppUpdateContextValue | null>(null);
