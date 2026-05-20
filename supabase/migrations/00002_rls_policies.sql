-- =============================================================
-- RLS POLICIES — Multi-tenant isolation via JWT claims
-- =============================================================

-- Helper: extrai tenant_id do JWT (setado pelo custom_jwt_claims hook)
CREATE OR REPLACE FUNCTION public.auth_tenant_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'tenant_id')::UUID,
    (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
$$;

-- Helper: extrai role do JWT
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(
    auth.jwt() ->> 'user_role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
$$;

-- =============================================================
-- Habilitar RLS em todas as tabelas
-- =============================================================
ALTER TABLE public.tenants          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- TENANTS — apenas o próprio tenant; apenas owner pode atualizar
-- =============================================================
CREATE POLICY "tenants_select" ON public.tenants FOR SELECT
  USING (id = public.auth_tenant_id());

CREATE POLICY "tenants_update" ON public.tenants FOR UPDATE
  USING (id = public.auth_tenant_id() AND public.auth_role() = 'owner');

-- =============================================================
-- USERS — mesmo tenant; operators veem apenas a si mesmos
-- =============================================================
CREATE POLICY "users_select" ON public.users FOR SELECT
  USING (
    tenant_id = public.auth_tenant_id()
    AND (
      public.auth_role() IN ('owner','admin')
      OR id = auth.uid()
    )
  );

CREATE POLICY "users_insert" ON public.users FOR INSERT
  WITH CHECK (
    tenant_id = public.auth_tenant_id()
    AND public.auth_role() IN ('owner','admin')
  );

CREATE POLICY "users_update" ON public.users FOR UPDATE
  USING (
    tenant_id = public.auth_tenant_id()
    AND (public.auth_role() IN ('owner','admin') OR id = auth.uid())
  );

CREATE POLICY "users_delete" ON public.users FOR DELETE
  USING (tenant_id = public.auth_tenant_id() AND public.auth_role() = 'owner');

-- =============================================================
-- Políticas padrão para tabelas operacionais
-- SELECT: todos do tenant | INSERT/UPDATE: operator+ | DELETE: admin+
-- =============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'warehouses','categories','products','inventory_items',
    'kanban_stages','kanban_cards'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY "%I_select" ON public.%I FOR SELECT
       USING (tenant_id = public.auth_tenant_id());', t, t);

    EXECUTE format(
      'CREATE POLICY "%I_insert" ON public.%I FOR INSERT
       WITH CHECK (
         tenant_id = public.auth_tenant_id()
         AND public.auth_role() IN (''owner'',''admin'',''operator'')
       );', t, t);

    EXECUTE format(
      'CREATE POLICY "%I_update" ON public.%I FOR UPDATE
       USING (
         tenant_id = public.auth_tenant_id()
         AND public.auth_role() IN (''owner'',''admin'',''operator'')
       );', t, t);

    EXECUTE format(
      'CREATE POLICY "%I_delete" ON public.%I FOR DELETE
       USING (
         tenant_id = public.auth_tenant_id()
         AND public.auth_role() IN (''owner'',''admin'')
       );', t, t);
  END LOOP;
END;
$$;

-- =============================================================
-- TRANSACTIONS — append-only (INSERT apenas); sem UPDATE/DELETE
-- =============================================================
CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
  USING (tenant_id = public.auth_tenant_id());

CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
  WITH CHECK (
    tenant_id = public.auth_tenant_id()
    AND public.auth_role() IN ('owner','admin','operator')
    AND user_id = auth.uid()
  );

-- Sem UPDATE ou DELETE — transações são imutáveis (auditoria)

-- =============================================================
-- NOTIFICATIONS — cada usuário vê apenas as próprias
-- =============================================================
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT
  USING (user_id = auth.uid() AND tenant_id = public.auth_tenant_id());

CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- INSERT via SECURITY DEFINER functions (triggers) — sem policy de insert para users
