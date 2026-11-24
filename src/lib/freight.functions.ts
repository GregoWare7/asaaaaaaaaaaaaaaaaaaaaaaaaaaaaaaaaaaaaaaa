import { createServerFn } from "@tanstack/react-start";
import { ORIGIN } from "./delivery";

const UA = "FB-Tabacaria/1.0 (pedidos)";

export const quoteDistance = createServerFn({ method: "POST" })
  .inputValidator((d: { address: string }) => {
    const address = String(d?.address ?? "").trim();
    if (address.length < 5 || address.length > 300) throw new Error("Endereço inválido");
    return { address };
  })
  .handler(async ({ data }) => {
    const q = /mt|mato grosso/i.test(data.address) ? data.address : `${data.address}, MT`;
    const geo = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&viewbox=-56.5,-15.3,-55.7,-16.0&q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": UA, "Accept-Language": "pt-BR" } },
    );
    if (!geo.ok) throw new Error(`Falha ao localizar endereço (${geo.status})`);
    const places = (await geo.json()) as { lat: string; lon: string; display_name: string }[];
    const place = places[0];
    if (!place) return { ok: false as const, error: "Endereço não encontrado. Inclua rua, número, bairro e cidade." };
    const route = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${ORIGIN.lon},${ORIGIN.lat};${place.lon},${place.lat}?overview=false`,
    );
    if (!route.ok) throw new Error(`Falha ao calcular rota (${route.status})`);
    const r = (await route.json()) as { routes?: { distance: number }[] };
    const meters = r.routes?.[0]?.distance;
    if (meters == null) return { ok: false as const, error: "Não foi possível calcular a rota até esse endereço." };
    return { ok: true as const, km: Math.round(meters / 100) / 10, found: place.display_name };
  });
