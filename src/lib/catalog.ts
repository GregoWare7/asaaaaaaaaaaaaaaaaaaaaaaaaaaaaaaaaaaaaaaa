import { queryOptions } from "@tanstack/react-query";
import { assetUrl } from "@/lib/asset-url";
import { supabase } from "@/integrations/supabase/client";

export type Sabor = { id: string; produto_id: string; nome: string; disponivel: boolean; ordem: number };
export type Produto = {
  id: string;
  nome: string;
  categoria: string | null;
  descricao: string | null;
  preco: number | null;
  imagem_url: string | null;
  disponivel: boolean;
  ordem: number;
  sabores: Sabor[];
};

export async function fetchCatalog(): Promise<Produto[]> {
  const [p, s] = await Promise.all([
    supabase.from("produtos").select("id,nome,categoria,descricao,preco,imagem_url,disponivel,ordem").order("ordem").order("nome"),
    supabase.from("sabores").select("id,produto_id,nome,disponivel,ordem").order("ordem").order("nome"),
  ]);
  if (p.error) throw new Error(p.error.message);
  if (s.error) throw new Error(s.error.message);
  return (p.data ?? []).map((prod) => ({
    ...prod,
    preco: prod.preco == null ? null : Number(prod.preco),
    imagem_url: assetUrl(prod.imagem_url),
    sabores: (s.data ?? []).filter((x) => x.produto_id === prod.id),
  }));
}

export const catalogQuery = queryOptions({ queryKey: ["catalog"], queryFn: fetchCatalog });

/** Situação do produto na vitrine. */
export function productStatus(p: Produto): "esgotado" | "indisponivel" | "ok" {
  if (!p.disponivel) return "esgotado";
  if (p.sabores.length > 0 && !p.sabores.some((s) => s.disponivel)) return "indisponivel";
  return "ok";
}
