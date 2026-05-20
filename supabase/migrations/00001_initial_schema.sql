-- =============================================================
-- INVENTORY SAAS — Schema inicial
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TENANTS (Empresas)
-- =============================================================
CREATE TABLE public.tenants (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'free'
              CHECK (plan IN ('free', 'pro', 'enterprise')),
  logo_url    TEXT,
  settings    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- USERS (extends auth.users)
-- =============================================================
CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'operator'
               CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  push_token   TEXT,
  fcm_token    TEXT,
  last_seen_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON public.users(tenant_id);

-- =============================================================
-- WAREHOUSES (Depósitos)
-- =============================================================
CREATE TABLE public.warehouses (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  location   TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_warehouses_tenant ON public.warehouses(tenant_id);

-- =============================================================
-- CATEGORIES (Categorias de produtos)
-- =============================================================
CREATE TABLE public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#A8C8E8',
  icon        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);

-- =============================================================
-- PRODUCTS (Produtos / Insumos)
-- =============================================================
CREATE TABLE public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id    UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  sku          TEXT,
  barcode      TEXT,
  qr_code      TEXT UNIQUE,
  description  TEXT,
  unit         TEXT NOT NULL DEFAULT 'un'
               CHECK (unit IN ('un','kg','g','l','ml','m','cx','pct')),
  cost_price   NUMERIC(12,2),
  sale_price   NUMERIC(12,2),
  min_stock    INTEGER NOT NULL DEFAULT 0,
  image_url    TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sku)
);

CREATE INDEX idx_products_tenant   ON public.products(tenant_id);
CREATE INDEX idx_products_qr       ON public.products(qr_code);
CREATE INDEX idx_products_category ON public.products(category_id);

-- =============================================================
-- INVENTORY ITEMS (Saldo atual por produto+depósito)
-- =============================================================
CREATE TABLE public.inventory_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  warehouse_id  UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved_qty  NUMERIC(12,3) NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_inventory_tenant  ON public.inventory_items(tenant_id);
CREATE INDEX idx_inventory_product ON public.inventory_items(product_id);

-- =============================================================
-- TRANSACTIONS (Movimentações — append-only, imutável)
-- =============================================================
CREATE TABLE public.transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id      UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES public.products(id),
  warehouse_id   UUID NOT NULL REFERENCES public.warehouses(id),
  user_id        UUID NOT NULL REFERENCES public.users(id),
  type           TEXT NOT NULL
                 CHECK (type IN ('entry','exit','adjustment','transfer_in','transfer_out')),
  quantity       NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_cost      NUMERIC(12,2),
  reference      TEXT,
  notes          TEXT,
  scanned_via_qr BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_tenant  ON public.transactions(tenant_id);
CREATE INDEX idx_transactions_product ON public.transactions(product_id);
CREATE INDEX idx_transactions_created ON public.transactions(created_at DESC);

-- =============================================================
-- KANBAN STAGES (Colunas do Kanban por tenant)
-- =============================================================
CREATE TABLE public.kanban_stages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#A8D8B0',
  position    INTEGER NOT NULL DEFAULT 0,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX idx_kanban_stages_tenant ON public.kanban_stages(tenant_id);

-- =============================================================
-- KANBAN CARDS (Cartões no fluxo)
-- =============================================================
CREATE TABLE public.kanban_cards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  stage_id    UUID NOT NULL REFERENCES public.kanban_stages(id),
  product_id  UUID REFERENCES public.products(id),
  title       TEXT NOT NULL,
  description TEXT,
  quantity    NUMERIC(12,3),
  priority    TEXT NOT NULL DEFAULT 'medium'
              CHECK (priority IN ('low','medium','high','urgent')),
  due_date    DATE,
  assignee_id UUID REFERENCES public.users(id),
  position    FLOAT NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kanban_cards_stage  ON public.kanban_cards(stage_id);
CREATE INDEX idx_kanban_cards_tenant ON public.kanban_cards(tenant_id);

-- =============================================================
-- NOTIFICATIONS
-- =============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
             CHECK (type IN ('low_stock','transaction','kanban_move','mention','system')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);

-- =============================================================
-- TRIGGER: set_updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'tenants','users','warehouses','categories',
    'products','inventory_items','kanban_cards'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();', t, t);
  END LOOP;
END;
$$;

-- =============================================================
-- TRIGGER: apply_transaction_to_stock
-- Atualiza inventory_items e cria notificação de estoque baixo
-- =============================================================
CREATE OR REPLACE FUNCTION public.apply_transaction_to_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_delta    NUMERIC(12,3);
  v_product  public.products;
  v_inv      public.inventory_items;
  v_user     RECORD;
BEGIN
  v_delta := CASE
    WHEN NEW.type IN ('entry', 'transfer_in')   THEN  NEW.quantity
    WHEN NEW.type IN ('exit',  'transfer_out')  THEN -NEW.quantity
    WHEN NEW.type = 'adjustment'                 THEN  NEW.quantity
  END;

  INSERT INTO public.inventory_items
    (tenant_id, product_id, warehouse_id, quantity)
  VALUES
    (NEW.tenant_id, NEW.product_id, NEW.warehouse_id, GREATEST(0, v_delta))
  ON CONFLICT (product_id, warehouse_id)
  DO UPDATE SET
    quantity   = GREATEST(0, public.inventory_items.quantity + v_delta),
    updated_at = NOW();

  -- Verificar estoque mínimo e notificar
  SELECT * INTO v_product FROM public.products WHERE id = NEW.product_id;
  SELECT * INTO v_inv FROM public.inventory_items
    WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;

  IF v_product.min_stock > 0 AND v_inv.quantity <= v_product.min_stock THEN
    FOR v_user IN
      SELECT id FROM public.users
      WHERE tenant_id = NEW.tenant_id
        AND role IN ('owner','admin')
        AND is_active = TRUE
    LOOP
      INSERT INTO public.notifications
        (tenant_id, user_id, type, title, body, data)
      VALUES (
        NEW.tenant_id,
        v_user.id,
        'low_stock',
        'Estoque baixo: ' || v_product.name,
        'O produto ' || v_product.name || ' está com estoque de ' ||
          v_inv.quantity || ' ' || v_product.unit || ' (mínimo: ' ||
          v_product.min_stock || ').',
        jsonb_build_object(
          'product_id',  v_product.id,
          'quantity',    v_inv.quantity,
          'min_stock',   v_product.min_stock,
          'warehouse_id', NEW.warehouse_id
        )
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transaction_apply_stock
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_to_stock();

-- =============================================================
-- TRIGGER: handle_new_user
-- Cria tenant + perfil + depósito + stages Kanban padrão no signup
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tenant_id  UUID;
  v_tenant_id_meta UUID;
BEGIN
  -- Se já existe tenant_id nos metadados (usuário convidado), não cria novo tenant
  v_tenant_id_meta := (NEW.raw_user_meta_data->>'tenant_id')::UUID;

  IF v_tenant_id_meta IS NOT NULL THEN
    -- Usuário convidado: insere no tenant existente
    INSERT INTO public.users (id, tenant_id, full_name, role)
    VALUES (
      NEW.id,
      v_tenant_id_meta,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
    );
    RETURN NEW;
  END IF;

  -- Novo tenant (dono da conta)
  INSERT INTO public.tenants (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
    LOWER(REGEXP_REPLACE(
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'empresa'),
      '[^a-z0-9]', '-', 'g'
    )) || '-' || SUBSTR(NEW.id::TEXT, 1, 8)
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.users (id, tenant_id, full_name, role)
  VALUES (
    NEW.id, v_tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'owner'
  );

  INSERT INTO public.warehouses (tenant_id, name, is_default)
  VALUES (v_tenant_id, 'Depósito Principal', TRUE);

  INSERT INTO public.kanban_stages (tenant_id, name, color, position, is_terminal)
  VALUES
    (v_tenant_id, 'Pendente',     '#FFD6A5', 0, FALSE),
    (v_tenant_id, 'Em Andamento', '#CAFFBF', 1, FALSE),
    (v_tenant_id, 'Concluído',    '#A8D8EA', 2, TRUE);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================
-- FUNCTION: custom_jwt_claims (Auth Hook)
-- Embute tenant_id e user_role no JWT
-- =============================================================
CREATE OR REPLACE FUNCTION public.custom_jwt_claims(event JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user public.users;
BEGIN
  SELECT * INTO v_user
  FROM public.users
  WHERE id = (event->>'user_id')::UUID;

  IF NOT FOUND THEN
    RETURN '{}'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'tenant_id',  v_user.tenant_id,
    'user_role',  v_user.role
  );
END;
$$;
