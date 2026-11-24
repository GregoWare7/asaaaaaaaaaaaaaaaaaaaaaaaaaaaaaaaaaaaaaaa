// Origem confirmada pelo link do Residencial Chapada das Cerejeiras enviado pelo lojista.
export const ORIGIN = {
  lat: -15.6710518,
  lon: -56.11496,
  label: "Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT",
} as const;

export const PRICE_PER_KM = 1.5;
export const MAX_DELIVERY_KM = 50;

export type DeliveryPoint = { lat: number; lon: number };

export function billableKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) throw new Error("Distância inválida");
  return Math.ceil(km);
}

/** Frete: distância da rota arredondada para cima × R$ 1,50. */
export function deliveryFee(km: number): number {
  return billableKm(km) * PRICE_PER_KM;
}

export function isOutsideDeliveryArea(km: number): boolean {
  return !Number.isFinite(km) || km > MAX_DELIVERY_KM;
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
