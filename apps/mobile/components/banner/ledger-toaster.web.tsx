import { Toaster } from "@/lib/sonner";

/** Web host uses original Sonner chrome; native styles live in `ledger-toaster.tsx`. */
export function LedgerToaster() {
  return <Toaster position="top-center" closeButton richColors />;
}
