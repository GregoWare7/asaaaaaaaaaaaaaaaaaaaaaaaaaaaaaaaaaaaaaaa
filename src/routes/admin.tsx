import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, ImagePlus, Loader2, LogOut, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { catalogQuery, type Produto, type Sabor } from "@/lib/catalog";
import { brl } from "@/lib/delivery";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel da loja | FB Tabacaria" },
      { name: "description", content: "Painel para controlar estoque, produtos e sabores da FB Tabacaria." },
      { property: "og:title", content: "Painel da loja | FB Tabacaria" },
      { property: "og:description", content: "Controle de estoque da FB Tabacaria." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <main className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></main>;
  return session ? <Panel email={session.user.email ?? ""} /> : <Login />;
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("E-mail ou senha incorretos.");
  };
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 font-display text-5xl text-glow">Painel da loja</h1>
      <form onSubmit={submit} className="space-y-4">
        <Input className="h-14 text-lg" type="email" required autoComplete="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input className="h-14 text-lg" type="password" required autoComplete="current-password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" className="h-14 w-full text-lg" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Entrar</Button>
      </form>
    </main>
  );
}

type ProdForm = { id?: string; nome: string; categoria: string; descricao: string; preco: string; imagem_url: string };
type SaborForm = { id?: string; produto_id: string; nome: string };

function Panel({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(catalogQuery);
  const [prodForm, setProdForm] = useState<ProdForm | null>(null);
  const [saborForm, setSaborForm] = useState<SaborForm | null>(null);
  const [filter, setFilter] = useState("");
  const [onlyNoPhoto, setOnlyNoPhoto] = useState(false);
  const [photoFor, setPhotoFor] = useState<{ p: Produto; url: string } | null>(null);
  const [photoOk, setPhotoOk] = useState(false);

  const patch = (fn: (list: Produto[]) => Produto[]) => qc.setQueryData(catalogQuery.queryKey, (old) => (old ? fn(old) : old));
  const refresh = () => qc.invalidateQueries({ queryKey: catalogQuery.queryKey });
  const fail = (msg: string) => { toast.error(msg); refresh(); };

  const toggleProduto = async (p: Produto, v: boolean) => {
    patch((l) => l.map((x) => (x.id === p.id ? { ...x, disponivel: v } : x)));
    const { error } = await supabase.from("produtos").update({ disponivel: v }).eq("id", p.id);
    if (error) fail("Não foi possível salvar.");
  };
  const toggleSabor = async (s: Sabor, v: boolean) => {
    patch((l) => l.map((x) => (x.id === s.produto_id ? { ...x, sabores: x.sabores.map((y) => (y.id === s.id ? { ...y, disponivel: v } : y)) } : x)));
    const { error } = await supabase.from("sabores").update({ disponivel: v }).eq("id", s.id);
    if (error) fail("Não foi possível salvar.");
  };
  const markAll = async (p: Produto, v: boolean) => {
    patch((l) => l.map((x) => (x.id === p.id ? { ...x, disponivel: v, sabores: x.sabores.map((y) => ({ ...y, disponivel: v })) } : x)));
    const [a, b] = await Promise.all([
      supabase.from("produtos").update({ disponivel: v }).eq("id", p.id),
      supabase.from("sabores").update({ disponivel: v }).eq("produto_id", p.id),
    ]);
    if (a.error || b.error) fail("Não foi possível salvar.");
    else toast.success(v ? "Tudo marcado como disponível" : "Tudo marcado como esgotado");
  };

  const saveProduto = async (e: FormEvent) => {
    e.preventDefault();
    if (!prodForm) return;
    const preco = prodForm.preco.trim() ? Number(prodForm.preco.replace(",", ".")) : null;
    if (preco != null && (!Number.isFinite(preco) || preco < 0)) { toast.error("Preço inválido."); return; }
    const row = {
      nome: prodForm.nome.trim(),
      categoria: prodForm.categoria.trim() || null,
      descricao: prodForm.descricao.trim() || null,
      preco,
      imagem_url: prodForm.imagem_url.trim() || null,
    };
    const { error } = prodForm.id
      ? await supabase.from("produtos").update(row).eq("id", prodForm.id)
      : await supabase.from("produtos").insert({ ...row, disponivel: true, ordem: (data?.length ?? 0) + 1 });
    if (error) { toast.error("Não foi possível salvar o produto."); return; }
    toast.success("Produto salvo");
    setProdForm(null);
    refresh();
  };
  const deleteProduto = async (p: Produto) => {
    if (!confirm(`Excluir "${p.nome}" e todos os sabores?`)) return;
    await supabase.from("sabores").delete().eq("produto_id", p.id);
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) fail("Não foi possível excluir."); else { toast.success("Produto excluído"); refresh(); }
  };
  const saveSabor = async (e: FormEvent) => {
    e.preventDefault();
    if (!saborForm) return;
    const nome = saborForm.nome.trim();
    const count = data?.find((p) => p.id === saborForm.produto_id)?.sabores.length ?? 0;
    const { error } = saborForm.id
      ? await supabase.from("sabores").update({ nome }).eq("id", saborForm.id)
      : await supabase.from("sabores").insert({ produto_id: saborForm.produto_id, nome, disponivel: true, ordem: count + 1 });
    if (error) { toast.error("Não foi possível salvar o sabor."); return; }
    toast.success("Sabor salvo");
    setSaborForm(null);
    refresh();
  };
  const deleteSabor = async (s: Sabor) => {
    if (!confirm(`Excluir o sabor "${s.nome}"?`)) return;
    const { error } = await supabase.from("sabores").delete().eq("id", s.id);
    if (error) fail("Não foi possível excluir."); else refresh();
  };

  const savePhoto = async (e: FormEvent) => {
    e.preventDefault();
    if (!photoFor) return;
    const url = photoFor.url.trim() || null;
    const { error } = await supabase.from("produtos").update({ imagem_url: url }).eq("id", photoFor.p.id);
    if (error) { toast.error("Não foi possível salvar a foto."); return; }
    patch((l) => l.map((x) => (x.id === photoFor.p.id ? { ...x, imagem_url: url } : x)));
    toast.success(url ? "Foto salva" : "Foto removida");
    setPhotoFor(null);
  };
  const semFoto = (data ?? []).filter((p) => !p.imagem_url).length;
  const list = (data ?? []).filter((p) => !onlyNoPhoto || !p.imagem_url).filter((p) => !filter || `${p.nome} ${p.categoria ?? ""}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => Number(b.disponivel) - Number(a.disponivel)); // disponíveis primeiro

  return (
    <main className="mx-auto max-w-2xl px-3 pb-24 pt-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="font-display text-4xl text-glow">Estoque</h1>
        <Button variant="outline" size="lg" onClick={() => supabase.auth.signOut()} aria-label={`Sair (${email})`}><LogOut />Sair</Button>
      </div>
      <Button size="lg" className="mb-3 h-14 w-full text-lg" onClick={() => setProdForm({ nome: "", categoria: "", descricao: "", preco: "", imagem_url: "" })}><Plus />Novo produto</Button>
      <Input className="mb-4 h-12" placeholder="Buscar produto" value={filter} onChange={(e) => setFilter(e.target.value)} />
      {semFoto > 0 && (
        <button type="button" onClick={() => setOnlyNoPhoto((v) => !v)}
          className={`mb-4 flex w-full items-center gap-3 rounded-xl border p-4 text-left ${onlyNoPhoto ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
          <ImageOff className="h-6 w-6 shrink-0 text-destructive" />
          <span className="flex-1"><b>{semFoto} produto{semFoto > 1 ? "s" : ""} sem foto</b><br />
            <span className="text-sm text-muted-foreground">{onlyNoPhoto ? "Mostrando só os sem foto. Toque para ver todos." : "Toque para ver só esses."}</span></span>
        </button>
      )}
      {onlyNoPhoto && semFoto === 0 && <p className="mb-4 text-center text-primary">Todos os produtos têm foto!</p>}
      {isLoading && <Loader2 className="mx-auto animate-spin" />}

      <div className="space-y-4">
        {list.map((p) => (
          <section key={p.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => { setPhotoOk(false); setPhotoFor({ p, url: p.imagem_url ?? "" }); }}
                aria-label={p.imagem_url ? `Trocar foto de ${p.nome}` : `Adicionar foto a ${p.nome}`}
                className={`grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-lg border-2 ${p.imagem_url ? "border-border" : "border-dashed border-destructive text-destructive"}`}>
                {p.imagem_url ? <img src={p.imagem_url} alt="" className="h-full w-full object-cover" />
                  : <span className="flex flex-col items-center text-[11px] font-bold"><ImagePlus className="h-6 w-6" />Sem foto</span>}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{p.categoria ?? "Sem categoria"}</p>
                <h2 className="text-lg font-bold leading-tight">{p.nome}</h2>
                <p className="text-sm text-muted-foreground">{p.preco == null ? "Sem preço" : brl(p.preco)}</p>
              </div>
              <label className="flex shrink-0 flex-col items-center gap-1">
                <Switch className="scale-150" checked={p.disponivel} onCheckedChange={(v) => toggleProduto(p, v)} aria-label={`Disponibilidade de ${p.nome}`} />
                <span className={`mt-1 text-xs font-bold ${p.disponivel ? "text-primary" : "text-destructive"}`}>{p.disponivel ? "Disponível" : "Esgotado"}</span>
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button variant="secondary" className="h-12" onClick={() => markAll(p, true)}>Marcar todos disponíveis</Button>
              <Button variant="secondary" className="h-12" onClick={() => markAll(p, false)}>Marcar todos esgotados</Button>
            </div>
            <ul className="mt-3 divide-y divide-border">
              {p.sabores.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2">
                  <span className={`flex-1 ${s.disponivel ? "" : "text-muted-foreground line-through"}`}>{s.nome}</span>
                  <Button size="icon" variant="ghost" className="h-11 w-11" aria-label={`Editar ${s.nome}`} onClick={() => setSaborForm({ id: s.id, produto_id: p.id, nome: s.nome })}><Pencil /></Button>
                  <Button size="icon" variant="ghost" className="h-11 w-11" aria-label={`Excluir ${s.nome}`} onClick={() => deleteSabor(s)}><Trash2 /></Button>
                  <Switch className="ml-2 scale-125" checked={s.disponivel} onCheckedChange={(v) => toggleSabor(s, v)} aria-label={`Disponibilidade de ${s.nome}`} />
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-12" onClick={() => setSaborForm({ produto_id: p.id, nome: "" })}><Plus />Sabor</Button>
              <Button variant="outline" className="h-12" onClick={() => setProdForm({ id: p.id, nome: p.nome, categoria: p.categoria ?? "", descricao: p.descricao ?? "", preco: p.preco == null ? "" : String(p.preco), imagem_url: p.imagem_url ?? "" })}><Pencil />Editar</Button>
              <Button variant="outline" className="h-12 text-destructive" onClick={() => deleteProduto(p)}><Trash2 />Excluir</Button>
            </div>
          </section>
        ))}
      </div>

      <Dialog open={!!prodForm} onOpenChange={(o) => !o && setProdForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{prodForm?.id ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          {prodForm && (
            <form id="prod-form" onSubmit={saveProduto} className="space-y-3">
              <Input className="h-12" required placeholder="Nome" value={prodForm.nome} onChange={(e) => setProdForm({ ...prodForm, nome: e.target.value })} />
              <Input className="h-12" placeholder="Categoria (ex: Ignite)" value={prodForm.categoria} onChange={(e) => setProdForm({ ...prodForm, categoria: e.target.value })} />
              <Input className="h-12" inputMode="decimal" placeholder="Preço (opcional)" value={prodForm.preco} onChange={(e) => setProdForm({ ...prodForm, preco: e.target.value })} />
              <Input className="h-12" placeholder="Link da foto (opcional)" value={prodForm.imagem_url} onChange={(e) => setProdForm({ ...prodForm, imagem_url: e.target.value })} />
              <Textarea placeholder="Descrição (opcional)" value={prodForm.descricao} onChange={(e) => setProdForm({ ...prodForm, descricao: e.target.value })} />
            </form>
          )}
          <DialogFooter><Button form="prod-form" type="submit" size="lg" className="h-12 w-full">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!photoFor} onOpenChange={(o) => !o && setPhotoFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Foto: {photoFor?.p.nome}</DialogTitle></DialogHeader>
          {photoFor && (
            <form id="photo-form" onSubmit={savePhoto} className="space-y-3">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Toque em <b>Procurar foto</b> e encontre a imagem do produto.</li>
                <li>Segure o dedo na foto e escolha <b>Copiar endereço da imagem</b>.</li>
                <li>Cole o link abaixo e toque em <b>Salvar foto</b>.</li>
              </ol>
              <Button asChild variant="secondary" className="h-12 w-full">
                <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${photoFor.p.nome} pod`)}`} target="_blank" rel="noopener noreferrer"><Search />Procurar foto</a>
              </Button>
              <Input className="h-12" type="url" placeholder="Cole aqui o link da foto" value={photoFor.url}
                onChange={(e) => { setPhotoOk(false); setPhotoFor({ ...photoFor, url: e.target.value }); }} />
              {photoFor.url.trim() && (
                <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-lg bg-accent">
                  <img key={photoFor.url} src={photoFor.url.trim()} alt="Prévia" className="h-full w-full object-contain"
                    onLoad={() => setPhotoOk(true)} onError={() => setPhotoOk(false)} />
                </div>
              )}
              {photoFor.url.trim() && !photoOk && <p className="text-sm text-destructive">A prévia não carregou. Confira se o link é de uma imagem.</p>}
            </form>
          )}
          <DialogFooter className="gap-2">
            {photoFor?.p.imagem_url && <Button type="button" variant="outline" className="h-12 text-destructive" onClick={() => setPhotoFor(photoFor && { ...photoFor, url: "" })}>Remover foto</Button>}
            <Button form="photo-form" type="submit" size="lg" className="h-12 w-full" disabled={!!photoFor?.url.trim() && !photoOk}>Salvar foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!saborForm} onOpenChange={(o) => !o && setSaborForm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{saborForm?.id ? "Editar sabor" : "Novo sabor"}</DialogTitle></DialogHeader>
          {saborForm && (
            <form id="sabor-form" onSubmit={saveSabor}>
              <Input className="h-12" required placeholder="Nome do sabor" value={saborForm.nome} onChange={(e) => setSaborForm({ ...saborForm, nome: e.target.value })} />
            </form>
          )}
          <DialogFooter><Button form="sabor-form" type="submit" size="lg" className="h-12 w-full">Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
