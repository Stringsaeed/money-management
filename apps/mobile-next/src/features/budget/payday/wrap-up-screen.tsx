import { PaydayGate } from "./payday-gate";
import { WrapUpLoader } from "./wrap-up-loader";

/** C1: Month wrap-up, the first step after Got paid when a month has just ended. */
export function WrapUpScreen() {
  return <PaydayGate title="Month wrap-up">{(view) => <WrapUpLoader view={view} />}</PaydayGate>;
}
