import { createServerFn } from "@tanstack/react-start";
import { ORIGIN, type DeliveryPoint } from "./delivery";

const UA = "FB-Tabacaria/1.0 (pedidos)";
const LOCAL_VIEWBOX = "-56.55,-15.20,-55.65,-16.10";

type RouteResult =
  | { ok: true; km: number; point: DeliveryPoint }
  | { ok: false; error: string };

function validatePoint(input: { lat: number; lon: number }): DeliveryPoint {
  const lat = Number(input?.lat);
  const lon = Number(input?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error("Coordenadas inválidas");
  }
  return { lat, lon };
}

async function routeFromOrigin(point: DeliveryPoint): Promise<RouteResult> {
  // OSRM usa longitude,latitude e devolve a distância em metros.
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${point.lon},${point.lat}?overview=false`,
    { headers: { Accept: "application/json" } },
  );
  if (!response.ok) throw new Error(`Falha ao calcular rota (${response.status})`);
  const body = (await response.json()) as { routes?: { distance: number }[] };
  const meters = body.routes?.[0]?.distance;
  if (meters == null) return { ok: false, error: "Não foi possível calcular a rota até esse endereço." };
  return { ok: true, km: Math.round(meters / 100) / 10, point };
}

export const quoteRoute = createServerFn({ method: "POST" })
  .inputValidator(validatePoint)
  .handler(async ({ data }) => routeFromOrigin(data));

export const reverseAddress = createServerFn({ method: "POST" })
  .inputValidator(validatePoint)
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(data.lat),
      lon: String(data.lon),
      zoom: "18",
      addressdetails: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR" },
    });
    if (!response.ok) throw new Error(`Falha ao identificar endereço (${response.status})`);
    const place = (await response.json()) as { display_name?: string };
    if (!place.display_name) return { ok: false as const, error: "Endereço não identificado; você pode digitá-lo abaixo." };
    return { ok: true as const, address: place.display_name };
  });

export const quoteDistance = createServerFn({ method: "POST" })
  .inputValidator((input: { address: string }) => {
    const address = String(input?.address ?? "").trim();
    if (address.length < 5 || address.length > 300) throw new Error("Endereço inválido");
    return { address };
  })
  .handler(async ({ data }) => {
    const query = /mato grosso|\bmt\b/i.test(data.address) ? data.address : `${data.address}, MT`;
    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      countrycodes: "br",
      bounded: "1",
      viewbox: LOCAL_VIEWBOX,
      q: query,
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "User-Agent": UA, "Accept-Language": "pt-BR" },
    });
    if (!response.ok) throw new Error(`Falha ao localizar endereço (${response.status})`);
    const places = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const place = places[0];
    if (!place) {
      return { ok: false as const, error: "Endereço não encontrado. Tente selecionar o ponto no mapa." };
    }
    const point = { lat: Number(place.lat), lon: Number(place.lon) };
    const route = await routeFromOrigin(point);
    if (!route.ok) return route;
    return { ...route, found: place.display_name };
  });
