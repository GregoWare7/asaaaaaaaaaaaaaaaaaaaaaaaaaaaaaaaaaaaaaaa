// Ponto de saída: Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT (aprox.)
export const ORIGIN = { lat: -15.6788, lon: -56.1144, label: "Residencial Chapada das Cerejeiras, Costa Verde, Várzea Grande - MT" };
export const MIN_FEE = 10;
export const MIN_FEE_UP_TO_KM = 6;
export const PRICE_PER_KM = 2;

/** Frete: até 6 km = R$ 10; cada km a mais (arredondado pra cima) soma R$ 2. */
export function deliveryFee(km: number): number {
  if (!Number.isFinite(km) || km < 0) throw new Error("Distância inválida");
  const whole = Math.ceil(km);
  if (whole <= MIN_FEE_UP_TO_KM) return MIN_FEE;
  return MIN_FEE + (whole - MIN_FEE_UP_TO_KM) * PRICE_PER_KM;
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
