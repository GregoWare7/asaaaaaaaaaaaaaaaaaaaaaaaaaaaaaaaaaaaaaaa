import { describe, expect, it } from "vitest";
import { assetUrl } from "./asset-url";

describe("image source resolution", () => {
  it("uses the identical original Nikbar image instead of the embed-blocking optimizer", () => {
    const original = "https://cdn.vitrinevape.com/e65a7a096c1da51f35b086c994dec25b-681e411c96e64-01M528TV0EXJNEHJ18XSVJ2PTW.jpg";
    expect(assetUrl(`https://www.vitrinevape.com/_next/image/?url=${encodeURIComponent(original)}&w=3840&q=75`)).toBe(original);
  });
  it("does not unwrap other image providers or untrusted destinations", () => {
    const url = "https://www.vitrinevape.com/_next/image/?url=https%3A%2F%2Fexample.com%2Fphoto.jpg";
    expect(assetUrl(url)).toBe(url);
    expect(assetUrl("https://example.com/photo.webp")).toBe("https://example.com/photo.webp");
  });
  it("preserves missing images and local files", () => {
    expect(assetUrl(null)).toBeNull();
    expect(assetUrl("/photo.png")).toBe("/photo.png");
    expect(assetUrl("/__l5e/assets-v1/id/photo.jpg")).toBe("https://fbpods.lovable.app/__l5e/assets-v1/id/photo.jpg");
  });
});