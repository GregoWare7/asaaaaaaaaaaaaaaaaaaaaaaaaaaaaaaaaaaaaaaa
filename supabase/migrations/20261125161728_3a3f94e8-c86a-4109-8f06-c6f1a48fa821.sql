CREATE OR REPLACE FUNCTION public.is_loja_admin()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

DROP POLICY IF EXISTS "dono altera produtos" ON public.produtos;
DROP POLICY IF EXISTS "dono exclui produtos" ON public.produtos;
DROP POLICY IF EXISTS "dono insere produtos" ON public.produtos;
DROP POLICY IF EXISTS "dono altera sabores" ON public.sabores;
DROP POLICY IF EXISTS "dono exclui sabores" ON public.sabores;
DROP POLICY IF EXISTS "dono insere sabores" ON public.sabores;

CREATE POLICY "dono altera produtos" ON public.produtos FOR UPDATE TO authenticated USING (public.is_loja_admin()) WITH CHECK (public.is_loja_admin());
CREATE POLICY "dono exclui produtos" ON public.produtos FOR DELETE TO authenticated USING (public.is_loja_admin());
CREATE POLICY "dono insere produtos" ON public.produtos FOR INSERT TO authenticated WITH CHECK (public.is_loja_admin());
CREATE POLICY "dono altera sabores" ON public.sabores FOR UPDATE TO authenticated USING (public.is_loja_admin()) WITH CHECK (public.is_loja_admin());
CREATE POLICY "dono exclui sabores" ON public.sabores FOR DELETE TO authenticated USING (public.is_loja_admin());
CREATE POLICY "dono insere sabores" ON public.sabores FOR INSERT TO authenticated WITH CHECK (public.is_loja_admin());