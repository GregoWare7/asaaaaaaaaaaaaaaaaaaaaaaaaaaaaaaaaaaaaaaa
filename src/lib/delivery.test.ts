import { describe, expect, it } from "vitest";
import { deliveryFee } from "./delivery";

describe("tabela de frete", () => {
  it("1 km custa R$ 10", () => expect(deliveryFee(1)).toBe(10));
  it("6 km custa R$ 10", () => expect(deliveryFee(6)).toBe(10));
  it("7 km custa R$ 12", () => expect(deliveryFee(7)).toBe(12));
  it("8 km custa R$ 14", () => expect(deliveryFee(8)).toBe(14));
  it("6,2 km conta como 7 km: R$ 12", () => expect(deliveryFee(6.2)).toBe(12));
});
