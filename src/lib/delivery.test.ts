import { describe, expect, it } from "vitest";
import { billableKm, deliveryFee, isOutsideDeliveryArea } from "./delivery";

describe("tabela de frete", () => {
  it("1 km custa R$ 1,50", () => expect(deliveryFee(1)).toBe(1.5));
  it("6 km custa R$ 9", () => expect(deliveryFee(6)).toBe(9));
  it("7 km custa R$ 10,50", () => expect(deliveryFee(7)).toBe(10.5));
  it("8 km custa R$ 12", () => expect(deliveryFee(8)).toBe(12));
  it("6,2 km conta como 7 km: R$ 10,50", () => expect(deliveryFee(6.2)).toBe(10.5));
  it("50 km custa R$ 75", () => expect(deliveryFee(50)).toBe(75));
  it("arredonda qualquer fração de km para cima", () => expect(billableKm(0.1)).toBe(1));
});

describe("área de entrega", () => {
  it("aceita exatamente 50 km", () => expect(isOutsideDeliveryArea(50)).toBe(false));
  it("bloqueia distâncias acima de 50 km", () => expect(isOutsideDeliveryArea(50.1)).toBe(true));
});
