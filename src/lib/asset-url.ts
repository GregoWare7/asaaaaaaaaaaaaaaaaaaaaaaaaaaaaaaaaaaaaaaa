/** Lovable-hosted files (/__l5e/...) only exist on Lovable hosting; elsewhere (e.g. Vercel) point to the Lovable site. */
const ASSET_HOST = "https://fbpods.lovable.app";
export function assetUrl(url: string): string;
export function assetUrl(url: string | null): string | null;
export function assetUrl(url: string | null) {
  if (!url) return url;
  if (url.startsWith("/__l5e/")) return ASSET_HOST + url;
  // This store's optimizer rejects external embeds (403 + CORP same-origin).
  // Its original CDN image remains public; only unwrap this verified source.
  try {
    const source = new URL(url);
    if (source.origin === "https://www.vitrinevape.com" && source.pathname === "/_next/image/") {
      const original = source.searchParams.get("url");
      if (original) {
        const image = new URL(original);
        if (image.origin === "https://cdn.vitrinevape.com" && !image.username && !image.password) return image.href;
      }
    }
  } catch {
    // Preserve relative paths and user-supplied URLs not handled here.
  }
  return url;
}
