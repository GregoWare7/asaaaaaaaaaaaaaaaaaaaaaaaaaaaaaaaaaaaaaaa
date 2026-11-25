import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogQuery } from "@/lib/catalog";

export type CartProduct = { id: string; name: string; price: number };
type Line = { key: string; product: CartProduct; flavor: string; qty: number };
type Ctx = { lines: Line[]; add: (p: CartProduct, flavor: string) => void; setQty: (key: string, q: number) => void; clear: () => void; subtotal: number; count: number };
const CartCtx = createContext<Ctx | null>(null);
const KEY = "fb-cart-v3";

export function CartProvider({ children }: { children: ReactNode }) {
  const [stored, setLines] = useState<Line[]>([]);
  const catalog = useQuery(catalogQuery).data;
  // Sempre usa o preço atual do banco (carrinhos antigos podem ter preço 0 salvo).
  const lines = useMemo(() => {
    if (!catalog) return stored;
    return stored.map((l) => {
      const prod = catalog.find((c) => c.id === l.product.id);
      return prod && prod.preco != null ? { ...l, product: { ...l.product, price: prod.preco } } : l;
    });
  }, [stored, catalog]);
  useEffect(() => { try { setLines(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* vazio */ } }, []);
  const save = (n: Line[]) => { setLines(n); localStorage.setItem(KEY, JSON.stringify(n)); };
  const value: Ctx = {
    lines,
    add: (p, flavor) => {
      const k = `${p.id}|${flavor}`;
      const ex = lines.find((l) => l.key === k);
      save(ex ? lines.map((l) => (l.key === k ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { key: k, product: p, flavor, qty: 1 }]);
    },
    setQty: (key, q) => save(q <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, qty: q } : l))),
    clear: () => save([]),
    subtotal: lines.reduce((s, l) => s + l.product.price * l.qty, 0),
    count: lines.reduce((s, l) => s + l.qty, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}
export function useCart() { const c = useContext(CartCtx); if (!c) throw new Error("CartProvider ausente"); return c; }
