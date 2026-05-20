// Tipos gerados automaticamente pelo Supabase CLI:
// supabase gen types typescript --local > src/types/database.ts
//
// Este arquivo é um placeholder até rodar o comando acima.

export type Database = {
  public: {
    Tables: {
      tenants:         { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      users:           { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      warehouses:      { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      categories:      { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      products:        { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      inventory_items: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      transactions:    { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      kanban_stages:   { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      kanban_cards:    { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
      notifications:   { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }
    }
  }
}
