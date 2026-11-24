// Ponto de saída: Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT (aprox.)
export const ORIGIN = { lat: -15.6788, lon: -56.1144, label: "Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT" };
export const PRICE_PER_KM = 2;
export const FREE_DELIVERY_FROM = 200;

/** Frete: R$ 2 por km (distância de carro), grátis a partir de R$ 200 em produtos. */
export function deliveryFee(km: number, subtotal: number): number {
  if (!Number.isFinite(km) || km < 0) throw new Error("Distância inválida");
  if (subtotal >= FREE_DELIVERY_FROM) return 0;
  return Math.round(km * PRICE_PER_KM * 100) / 100;
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
