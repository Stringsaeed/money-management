import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

import { SITE_URL } from "./src/lib/site.ts";

export default defineConfig({
  site: SITE_URL,
  trailingSlash: "never",
  integrations: [
    // Currency variants and the 404 canonicalise elsewhere; only `/` belongs in the sitemap.
    sitemap({ filter: (page) => !/\/(c\/|404)/.test(new URL(page).pathname) }),
  ],
  build: {
    // One page, one request: the whole stylesheet ships inside the HTML.
    inlineStylesheets: "always",
    format: "file",
  },
  compressHTML: true,
  // Keep the dev preview identical to production.
  devToolbar: { enabled: false },
  // Self-hosted from the installed Fontsource packages (Latin subset, as on the canvas):
  // no third-party font request at runtime, and Astro emits metric-matched fallbacks.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Nunito",
      cssVariable: "--font-nunito",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          {
            weight: "200 1000",
            style: "normal",
            src: ["@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2"],
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "IBM Plex Mono",
      cssVariable: "--font-plex-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [400, 500, 600].map((weight) => ({
          weight,
          style: "normal",
          src: [`@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff2`],
        })),
      },
    },
  ],
});
