import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, Store, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import logo from "@/assets/logo.png.asset.json";
import heroBanner from "@/assets/hero-banner.png.asset.json";
import { Button } from "@/components/ui/button";
import { catalogQuery, productStatus, type Produto } from "@/lib/catalog";
import { brl } from "@/lib/delivery";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FB Tabacaria Cuiabá | Pods descartáveis" },
      { name: "description", content: "Pods descartáveis Ignite, Elfbar, Life Pod e mais em Cuiabá-MT. Entrega local rápida." },
      { property: "og:title", content: "FB Tabacaria Cuiabá" },
      { property: "og:description", content: "Entrega local em Cuiabá." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [cat, setCat] = useState("Todos");
  const { data, isLoading, error } = useQuery(catalogQuery);
  // Esgotados (ou sem nenhum sabor disponível) ficam fora da vitrine.
  const products = (data ?? []).filter((p) => productStatus(p) === "ok");
  const cats = ["Todos", ...Array.from(new Set(products.map((p) => p.categoria || "Outros")))];
  const groups = cat === "Todos" ? cats.slice(1) : [cat];
  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <section className="relative mt-4 overflow-hidden rounded-2xl border border-border shadow-glow">
        <img src={heroBanner.url} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-transparent" />
        <div className="relative flex flex-col items-center gap-5 px-4 py-10 text-center md:flex-row md:gap-10 md:px-10 md:py-16 md:text-left">
          <img src={logo.url} alt="Logo FB Tabacaria" className="h-32 w-32 shrink-0 rounded-full shadow-glow md:h-52 md:w-52" />
          <div className="space-y-4">
            <h1 className="font-display text-4xl leading-none tracking-wide text-glow sm:text-5xl md:text-7xl">A sua tabacaria em Cuiabá</h1>
            <p className="text-muted-foreground">Entrega rápida na cidade. Frete a partir de {brl(10)} (até 6,9 km).</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm md:justify-start">
              <span className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 backdrop-blur"><Bike className="h-4 w-4 text-primary" /> Entrega em até 1h</span>
              <span className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 backdrop-blur"><Store className="h-4 w-4 text-primary" /> (65) 99803-8731</span>
            </div>
          </div>
        </div>
      </section>
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${c === cat ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border text-muted-foreground"}`}>{c}</button>
        ))}
      </div>
      {isLoading && <p className="py-10 text-center text-muted-foreground">Carregando produtos...</p>}
      {error && <p className="py-10 text-center text-destructive">Não foi possível carregar os produtos. Atualize a página.</p>}
      {!isLoading && !error && products.length === 0 && <p className="py-10 text-center text-muted-foreground">Nenhum produto disponível no momento.</p>}
      {groups.map((g) => (
        <section key={g} className="mb-10">
          <h2 className="mb-4 font-display text-4xl tracking-wide text-glow">{g}</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {products.filter((p) => (p.categoria || "Outros") === g).map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      ))}
      <div className="mt-10 text-center"><Button asChild size="lg"><Link to="/checkout">Ver carrinho</Link></Button></div>
      <p className="mt-10 text-center text-xs text-muted-foreground">Venda proibida para menores de 18 anos.</p>
    </main>
  );
}

function ProductCard({ p }: { p: Produto }) {
  const { add } = useCart();
  const status = productStatus(p);
  const firstAvailable = p.sabores.find((s) => s.disponivel)?.nome ?? "";
  const [flavor, setFlavor] = useState(firstAvailable);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();
  const blocked = status !== "ok";
  const price = p.preco ?? 0;
  return (
    <article className={`glow-border flex flex-col rounded-xl bg-card p-4 transition ${blocked ? "opacity-60" : ""}`}>
      <div className="relative mb-3 grid aspect-square place-items-center overflow-hidden rounded-lg bg-accent">
        {p.imagem_url
          ? <img src={p.imagem_url} alt={p.nome} loading="lazy" className="h-full w-full object-cover" />
          : <span className="text-center font-display text-3xl text-primary text-glow">{p.categoria}</span>}
        {blocked && <span className="absolute left-2 top-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">{status === "esgotado" ? "Esgotado" : "Indisponível"}</span>}
      </div>
      <h3 className={`text-sm font-semibold md:text-base ${blocked ? "line-through" : ""}`}>{p.nome}</h3>
      {p.descricao && <p className="mt-1 text-xs text-muted-foreground">{p.descricao}</p>}
      {p.sabores.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground">Sabor</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {p.sabores.map((s) => {
              const off = !s.disponivel || status === "esgotado";
              return (
                <button key={s.id} type="button" disabled={off} onClick={() => setFlavor(s.nome)}
                  className={`rounded-full border px-2 py-0.5 text-xs ${off ? "border-border text-muted-foreground line-through" : flavor === s.nome ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground"}`}>
                  {s.nome}{!s.disponivel && <span className="ml-1 no-underline">· Esgotado</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <span className="font-bold">{p.preco == null ? "Realizar Pedido" : brl(price)}</span>
        <Button size="icon" aria-label={`Adicionar ${p.nome}`} disabled={blocked} onClick={() => { add({ id: p.id, name: p.nome, price }, flavor); setAdded(true); }}><Plus /></Button>
      </div>
      <Dialog open={added} onOpenChange={setAdded}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionado ao carrinho</DialogTitle>
            <DialogDescription>{p.nome}{flavor ? ` (${flavor})` : ""} · {p.preco == null ? "preço a combinar" : brl(price)}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdded(false)}>Continuar comprando</Button>
            <Button onClick={() => { setAdded(false); navigate({ to: "/checkout" }); }}>Finalizar compra</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
