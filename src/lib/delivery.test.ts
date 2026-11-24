import { describe, expect, it } from "vitest";
import { deliveryFee } from "./delivery";

describe("frete por km", () => {
  it("cobra R$ 2 por km", () => expect(deliveryFee(10, 50)).toBe(20));
  it("km quebrado: 7,3 km custa R$ 14,60", () => expect(deliveryFee(7.3, 50)).toBe(14.6));
  it("entrega grátis a partir de R$ 200", () => expect(deliveryFee(10, 200)).toBe(0));
});
