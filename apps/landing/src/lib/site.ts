/** Canonical origin. Overridable for preview deployments. */
export const SITE_URL = process.env.SITE_URL ?? "https://trove.ing";

export const site = {
  name: "Trove",
  title: "Trove — One number until payday",
  description:
    "Trove tells you what you can actually spend until payday, and keeps every account, bill and currency in one ledger. Recurring payments, live market quotes and a shared household budget. 100% free and open source. Coming soon to iPhone and Android.",
  locale: "en_AE",
  themeColor: "#151515",
} as const;

/** Not in the stores yet: every call to action reads "Coming soon". */
export const availability = {
  label: "Coming soon",
  platforms: "iPhone & Android",
} as const;

export const sourceUrl = "https://github.com/Stringsaeed/money-management";

export const footerLinks = [
  { label: "PRIVACY", href: "#privacy" },
  { label: "TERMS", href: "#terms" },
  { label: "SOURCE", href: sourceUrl },
] as const;
