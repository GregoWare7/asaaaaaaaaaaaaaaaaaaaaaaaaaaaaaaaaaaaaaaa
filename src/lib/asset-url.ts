/** Lovable-hosted files (/__l5e/...) only exist on Lovable hosting; elsewhere (e.g. Vercel) point to the Lovable site. */
const ASSET_HOST = "https://fbpods.lovable.app";
export function assetUrl(url: string): string;
export function assetUrl(url: string | null): string | null;
export function assetUrl(url: string | null) {
  return url && url.startsWith("/__l5e/") ? ASSET_HOST + url : url;
}
