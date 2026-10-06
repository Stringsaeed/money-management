import type { E2EConfig } from "e2e";
import { mobile } from "@e2e-dev/mobile";
import { chatgpt } from "e2e/oauth/chatgpt";

// Simulator the suite drives. Override with E2E_IOS_DEVICE (a simulator name or UDID);
// unset, the engine uses whichever iOS simulator is booted, or boots one.
const iphone = mobile({ platform: "ios", device: process.env.E2E_IOS_DEVICE, transition: 700 });

const METRO_URL = "http://localhost:8081";

export default {
  tests: "tests/**/*.e2e.ts",
  targets: [
    {
      name: "ios",
      engine: iphone,
      app: {
        // The Trove Next development build (`pnpm ios` installs it).
        bundleId: "com.stringsaeed.moneymanagement.next",
        // Load the JS straight from Metro and keep the dev menu out of the way.
        launchArguments: [
          "--initialUrl",
          METRO_URL,
          "-EXDevMenuShowsAtLaunch",
          "NO",
          "-EXDevMenuIsOnboardingFinished",
          "YES",
          "-EXDevMenuShowFloatingActionButton",
          "NO",
        ],
        // Starts the local API and Metro (reusing either when already running), warms the
        // iOS bundle, then answers on the readiness port.
        command: {
          executable: "node",
          args: ["scripts/e2e-stack.mjs"],
          env: { LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8" },
          startupTimeout: 300_000,
          reuseExisting: true,
          log: ".e2e/logs/app.log",
        },
        readyUrl: "http://127.0.0.1:8099",
      },
    },
  ],
  // Sign in with `pnpm exec e2e login openai`; `pnpm exec e2e models openai` lists the ids.
  agents: {
    default: {
      model: chatgpt("gpt-6-luna"),
      system:
        "You are a thorough QA agent testing Trove Next, a personal finance iOS app. " +
        "Use the controls on screen; verify every outcome before you finish.",
      context:
        "Trove Next keeps a ledger of accounts, categories, and transactions. " +
        "The tab bar has Home, Ledger, Market, and Settings tabs and a centre Create (+) button. " +
        "Tapping Create opens the New transaction editor; long-pressing it opens a sheet with " +
        "Transaction, Account, and Category. Editors save with the check-mark Save button in " +
        "the header. Amounts are entered on an on-screen number pad, not the keyboard: its keys " +
        'are buttons named "1" to "9", "0", "Decimal point", and "Delete digit". Tap one key per ' +
        'character; the amount reads back as "Amount <value> <currency>" (e.g. "Amount 750 USD"). ' +
        'Long-press "Delete digit" to clear an amount; a saved transaction opens with its amount ' +
        "already filled in. The keyboard covers the number pad while the Note field is focused.",
    },
  },
  timeout: 180_000,
  actionTimeout: 30_000,
  assertionTimeout: 10_000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
} satisfies E2EConfig;
