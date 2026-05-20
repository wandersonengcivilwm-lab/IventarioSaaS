-- =============================================================
-- REALTIME — Habilitar publicações para updates em tempo real
-- =============================================================

-- inventory_items: atualização de saldo em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;

-- transactions: feed de movimentações ao vivo
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;

-- kanban_cards: sync do quadro Kanban entre usuários
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_cards;

-- kanban_stages: mudanças de configuração do quadro
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_stages;

-- notifications: recebimento de alertas em tempo real
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
