// Origem confirmada pelo link do Residencial Chapada das Cerejeiras enviado pelo lojista.
export const ORIGIN = {
  lat: -15.6710518,
  lon: -56.11496,
  label: "Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT",
} as const;

/** Tabela de frete do lojista: R$ 10 de 100 m até 6,9 km, depois +R$ 2 por km. */
export const BASE_FEE = 10;
export const BASE_KM = 6;
export const FEE_PER_KM_AFTER_BASE = 2;
export const MAX_DELIVERY_KM = 50;

export type DeliveryPoint = { lat: number; lon: number };

/**
 * Faixa de cobrança: a parte inteira dos km da rota.
 * 6,9 km conta como 6 km (e não sobe para 7), 7,0 km conta como 7 km.
 */
export function billableKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) throw new Error("Distância inválida");
  return Math.floor(km);
}

/** Frete: R$ 10 até 6,9 km; 7 km = R$ 12; 8 km = R$ 14; e assim por diante. */
export function deliveryFee(km: number): number {
  const tier = billableKm(km);
  if (tier <= BASE_KM) return BASE_FEE;
  return BASE_FEE + (tier - BASE_KM) * FEE_PER_KM_AFTER_BASE;
}

export function isOutsideDeliveryArea(km: number): boolean {
  return !Number.isFinite(km) || km > MAX_DELIVERY_KM;
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
