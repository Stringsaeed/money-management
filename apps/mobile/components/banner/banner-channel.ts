export type BannerChannel = "access" | "sync" | "settlement";

export const BANNER_TOAST_IDS = {
  access: "banner:access",
  sync: "banner:sync",
  settlement: "banner:settlement",
} as const satisfies Record<BannerChannel, string>;

export const SUCCESS_TOAST_MS = 5000;
