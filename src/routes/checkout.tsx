import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useRef, useState, type FormEvent } from "react";
import { Minus, Plus, MapPin, Loader2, MapPinned, Navigation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { WHATSAPP } from "@/lib/products";
import {
  billableKm,
  brl,
  deliveryFee,
  isOutsideDeliveryArea,
  MAX_DELIVERY_KM,
  type DeliveryPoint,
} from "@/lib/delivery";
import { quoteDistance, quoteRoute, reverseAddress } from "@/lib/freight.functions";

const DeliveryMap = lazy(() => import("@/components/DeliveryMap"));

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Carrinho e entrega | FB Tabacaria" },
      { name: "description", content: "Escolha o local de entrega no mapa, calcule o frete por km e envie o pedido pelo WhatsApp." },
      { property: "og:title", content: "Carrinho e entrega | FB Tabacaria" },
      { property: "og:description", content: "Entrega local em Cuiabá e Várzea Grande com frete calculado pela rota." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const { lines, setQty, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [complement, setComplement] = useState("");
  const [destination, setDestination] = useState<DeliveryPoint | null>(null);
  const [locationSource, setLocationSource] = useState<"map" | "address" | null>(null);
  const [km, setKm] = useState<number | null>(null);
  const [found, setFound] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const requestRef = useRef(0);
  const [waUrl, setWaUrl] = useState("");

  const outsideArea = km != null && isOutsideDeliveryArea(km);
  const fee = km == null ? null : deliveryFee(km);
  const total = subtotal + (fee ?? 0);

  const selectOnMap = async (point: DeliveryPoint) => {
    const request = ++requestRef.current;
    setDestination(point);
    setLocationSource("map");
    setKm(null);
    setFound("");
    setQuoteError("");
    setQuoting(true);

    const [routeResult, addressResult] = await Promise.allSettled([
      quoteRoute({ data: point }),
      reverseAddress({ data: point }),
    ]);
    if (request !== requestRef.current) return;

    if (routeResult.status === "fulfilled" && routeResult.value.ok) {
      setKm(routeResult.value.km);
    } else {
      setQuoteError(
        routeResult.status === "fulfilled" && !routeResult.value.ok
          ? routeResult.value.error
          : "Não foi possível calcular a rota. Tente outro ponto no mapa.",
      );
    }

    if (addressResult.status === "fulfilled" && addressResult.value.ok) {
      setAddress(addressResult.value.address);
    } else if (!address.trim()) {
      setAddress("Ponto selecionado no mapa");
    }
    setQuoting(false);
  };

  const calculateTypedAddress = async () => {
    if (address.trim().length < 5) {
      setQuoteError("Digite o endereço completo ou selecione no mapa.");
      return;
    }
    const request = ++requestRef.current;
    setQuoting(true);
    setQuoteError("");
    setKm(null);
    setDestination(null);
    setLocationSource(null);
    setFound("");
    try {
      const result = await quoteDistance({ data: { address } });
      if (request !== requestRef.current) return;
      if (result.ok) {
        setDestination(result.point);
        setKm(result.km);
        setFound(result.found);
        setLocationSource("address");
      } else {
        setQuoteError(result.error);
      }
    } catch {
      if (request === requestRef.current) setQuoteError("Não foi possível calcular agora. Tente selecionar no mapa.");
    } finally {
      if (request === requestRef.current) setQuoting(false);
    }
  };

  const changeAddress = (value: string) => {
    setAddress(value);
    if (locationSource !== "map") {
      requestRef.current += 1;
      setDestination(null);
      setLocationSource(null);
      setKm(null);
      setFound("");
      setQuoteError("");
      setQuoting(false);
    }
  };

  if (waUrl) {
    return (
      <main className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
        <h1 className="font-display text-5xl text-glow">Quase lá!</h1>
        <p className="text-muted-foreground">Se o WhatsApp não abriu sozinho, toque no botão abaixo para enviar seu pedido.</p>
        <Button asChild size="lg" className="h-14 w-full text-lg">
          <a href={waUrl} target="_blank" rel="noopener noreferrer">Abrir WhatsApp e enviar pedido</a>
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={() => { clear(); setWaUrl(""); }}>Já enviei, fazer novo pedido</Button>
      </main>
    );
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="font-display text-5xl text-glow">Carrinho vazio</h1>
        <Button asChild className="mt-6"><Link to="/">Ver produtos</Link></Button>
      </main>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (km == null || fee == null || !destination) {
      toast.error("Selecione o local e calcule o frete antes de enviar.");
      return;
    }
    if (outsideArea) {
      toast.error("Endereço fora da área de entrega");
      return;
    }
    const fullAddress = complement.trim() ? `${address}, ${complement.trim()}` : address;
    const message = [
      `Olá! Sou ${name} e quero fazer um pedido:`,
      ...lines.map((line) => `• ${line.qty}x ${line.product.name}${line.flavor ? ` (${line.flavor})` : ""} - ${brl(line.product.price * line.qty)}`),
      `Endereço: ${fullAddress}`,
      `Local no mapa: https://www.openstreetmap.org/?mlat=${destination.lat}&mlon=${destination.lon}#map=18/${destination.lat}/${destination.lon}`,
      `Distância pela rota: ${km.toLocaleString("pt-BR")} km (faixa de cobrança: ${billableKm(km)} km)`,
      `Subtotal: ${brl(subtotal)}`,
      `Frete: ${brl(fee)}`,
      `Total com frete: ${brl(total)}`,
    ].join("\n");
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
    setWaUrl(url);
    // Abre sempre em uma nova aba: o WhatsApp não pode abrir dentro de outra página.
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Abrindo o WhatsApp com seu pedido...");
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-[1fr_360px]">
      <form id="checkout" onSubmit={submit} className="space-y-6">
        <h1 className="font-display text-5xl text-glow">Finalizar pedido</h1>
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          {lines.map((line) => (
            <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{line.product.name}</p>
                <p className="text-xs text-muted-foreground">{line.flavor ? `Sabor: ${line.flavor} · ` : ""}{brl(line.product.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="icon" variant="outline" aria-label="Diminuir" onClick={() => setQty(line.key, line.qty - 1)}><Minus /></Button>
                <span className="w-6 text-center">{line.qty}</span>
                <Button type="button" size="icon" variant="outline" aria-label="Aumentar" onClick={() => setQty(line.key, line.qty + 1)}><Plus /></Button>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-3xl">Entrega</h2>
          <Input required placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} />

          <div className="rounded-xl border border-primary bg-card p-4">
            <h3 className="font-semibold">Escolha o local no mapa</h3>
            <p className="mt-1 text-sm text-muted-foreground">A forma mais precisa de calcular sua entrega.</p>
            <Dialog open={mapOpen} onOpenChange={setMapOpen}>
              <Button type="button" size="lg" className="mt-3 w-full" onClick={() => setMapOpen(true)}>
                <MapPinned />{destination && locationSource === "map" ? "Alterar ponto no mapa" : "Selecionar no mapa"}
              </Button>
              <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Onde devemos entregar?</DialogTitle>
                  <DialogDescription>Toque no local exato ou arraste o marcador. O endereço e o frete serão preenchidos automaticamente.</DialogDescription>
                </DialogHeader>
                <ClientOnly fallback={<div className="h-[360px] animate-pulse rounded-lg bg-muted" />}>
                  <Suspense fallback={<div className="h-[360px] animate-pulse rounded-lg bg-muted" />}>
                    <DeliveryMap selected={destination} onSelect={selectOnMap} />
                  </Suspense>
                </ClientOnly>
                {quoting && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Calculando rota e identificando endereço...</p>}
                {quoteError && <p className="text-sm text-destructive">{quoteError}</p>}
                <DialogFooter>
                  <Button type="button" onClick={() => setMapOpen(false)} disabled={!destination}>Usar este local</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="text-sm font-semibold">Endereço de entrega</label>
            <Textarea id="address" required placeholder="Rua, número, bairro e cidade" value={address} onChange={(event) => changeAddress(event.target.value)} />
            <Input placeholder="Complemento: número, bloco, referência (opcional)" value={complement} onChange={(event) => setComplement(event.target.value)} />
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Prefere buscar pelo endereço digitado?</p>
            <Button type="button" variant="outline" className="w-full" onClick={calculateTypedAddress} disabled={quoting}>
              {quoting ? <Loader2 className="animate-spin" /> : <Navigation />}Buscar endereço e calcular frete
            </Button>
          </div>

          {quoteError && !mapOpen && <p className="text-sm text-destructive">{quoteError}</p>}
          {found && <p className="text-xs text-muted-foreground">Local encontrado: {found}</p>}
          {outsideArea && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm font-semibold text-destructive">Endereço fora da área de entrega</p>}
          {km != null && fee != null && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>Distância pela rota: <b>{km.toLocaleString("pt-BR")} km</b> · Faixa de cobrança: <b>{billableKm(km)} km</b></p>
              <p className="mt-1">Frete: <b className="text-primary-glow">{brl(fee)}</b></p>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Frete de {brl(10)} de 100 metros até 6,9 km, depois +{brl(2)} por km. Entregas até {MAX_DELIVERY_KM} km, saindo do Residencial Chapada das Cerejeiras.</p>
        </section>
      </form>

      <aside className="h-fit space-y-3 rounded-xl border border-primary bg-card p-5 shadow-glow md:sticky md:top-24">
        <h2 className="font-display text-3xl">Resumo</h2>
        <Row k="Subtotal" v={brl(subtotal)} />
        <Row k="Distância" v={km == null ? "—" : `${km.toLocaleString("pt-BR")} km`} />
        <Row k="Frete" v={fee == null ? "Selecione o local" : brl(fee)} />
        <div className="border-t border-border pt-3"><Row k="Total com frete" v={brl(total)} bold /></div>
        <Button form="checkout" type="submit" size="lg" className="w-full" disabled={km == null || !destination || outsideArea || quoting}>
          <MapPin />Enviar pedido no WhatsApp
        </Button>
        {outsideArea && <p className="text-center text-xs text-destructive">Endereço fora da área de entrega</p>}
        <p className="text-center text-xs text-muted-foreground">Pagamento combinado na entrega.</p>
      </aside>
    </main>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return <div className={`flex justify-between gap-3 text-sm ${bold ? "text-lg font-bold" : ""}`}><span className="text-muted-foreground">{k}</span><span>{v}</span></div>;
}
