import { describe, expect, it } from "vitest";
import { billableKm, deliveryFee, isOutsideDeliveryArea } from "./delivery";

describe("tabela de frete", () => {
  it("100 metros custa R$ 10", () => expect(deliveryFee(0.1)).toBe(10));
  it("6 km custa R$ 10", () => expect(deliveryFee(6)).toBe(10));
  it("6,9 km custa R$ 10 (não sobe para a faixa de 7 km)", () => expect(deliveryFee(6.9)).toBe(10));
  it("7 km custa R$ 12", () => expect(deliveryFee(7)).toBe(12));
  it("7,9 km custa R$ 12", () => expect(deliveryFee(7.9)).toBe(12));
  it("8 km custa R$ 14", () => expect(deliveryFee(8)).toBe(14));
  it("10 km custa R$ 18", () => expect(deliveryFee(10)).toBe(18));
  it("50 km custa R$ 98", () => expect(deliveryFee(50)).toBe(98));
  it("faixa de cobrança é a parte inteira dos km", () => expect(billableKm(6.9)).toBe(6));
});

describe("área de entrega", () => {
  it("aceita exatamente 50 km", () => expect(isOutsideDeliveryArea(50)).toBe(false));
  it("bloqueia distâncias acima de 50 km", () => expect(isOutsideDeliveryArea(50.1)).toBe(true));
});
