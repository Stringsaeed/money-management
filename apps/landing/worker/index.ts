/**
 * Edge router for the static landing site. Every page is prerendered; this only chooses which
 * currency variant answers `/`, from the visitor's country (Cloudflare `request.cf.country`)
 * or an explicit `?currency=` override. The swap is an internal asset fetch, never a redirect,
 * so there is no flash, no client JavaScript, and `/` stays the one canonical URL.
 */
import { DEFAULT_CURRENCY, pickCurrency } from "../src/lib/currency";

interface Env {
  ASSETS: Fetcher;
}

const HOME_PATHS = new Set(["/", "/index.html"]);

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (HOME_PATHS.has(url.pathname)) {
      const country = request.cf?.country ?? null;
      const code = pickCurrency(url.searchParams.get("currency"), country);
      const target = code === DEFAULT_CURRENCY ? "/" : `/c/${code.toLowerCase()}`;
      const response = await env.ASSETS.fetch(new Request(new URL(target, url), request));
      const headers = new Headers(response.headers);
      // Shared caches must not hand one visitor's currency to another.
      headers.set("Cache-Control", "private, max-age=0, must-revalidate");
      headers.set("Content-Language", "en");
      return new Response(response.body, { status: response.status, headers });
    }

    const response = await env.ASSETS.fetch(request);
    if (!url.pathname.startsWith("/c/")) return response;
    // Variant URLs exist for QA and the router; search engines index only `/`.
    const headers = new Headers(response.headers);
    headers.set("X-Robots-Tag", "noindex");
    return new Response(response.body, { status: response.status, headers });
  },
} satisfies ExportedHandler<Env>;
