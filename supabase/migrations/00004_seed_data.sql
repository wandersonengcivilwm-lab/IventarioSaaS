-- =============================================================
-- SEED DATA — Apenas para desenvolvimento local
-- Execute: supabase db reset (aplica migrations + seed)
-- =============================================================

-- Este arquivo ficará vazio em produção.
-- Para dev local, adicione dados de teste após criar um usuário:

-- INSERT INTO public.categories (tenant_id, name, color, icon)
-- VALUES
--   ('<seu-tenant-id>', 'Matéria-prima',   '#A8C8E8', 'package'),
--   ('<seu-tenant-id>', 'Embalagens',       '#A8D8B0', 'box'),
--   ('<seu-tenant-id>', 'Produtos acabados','#F2E8A8', 'shopping-bag'),
--   ('<seu-tenant-id>', 'Limpeza',          '#E8A8C8', 'sparkles');

SELECT 'Seed data pronto para configuração manual após primeiro login.' AS info;
