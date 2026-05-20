import { useState, useEffect, useCallback, useRef } from 'react'
import { Q } from '@nozbe/watermelondb'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import {
  database,
  kanbanStagesCollection,
  kanbanCardsCollection,
} from '../db'
import KanbanStage from '../db/models/KanbanStage'
import KanbanCard  from '../db/models/KanbanCard'

export interface KanbanBoardData {
  stages: KanbanStage[]
  cardsByStage: Record<string, KanbanCard[]>
}

// Calcula posição fracionária entre dois cards (Lexorank-lite)
function positionBetween(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1
  if (before === null) return (after ?? 1) / 2
  if (after === null)  return (before ?? 0) + 1
  return (before + after) / 2
}

export function useKanban() {
  const tenantId = useAuthStore(s => s.tenantId)
  const profile  = useAuthStore(s => s.profile)

  const [stages, setStages]         = useState<KanbanStage[]>([])
  const [cardsByStage, setCards]    = useState<Record<string, KanbanCard[]>>({})
  const [loading, setLoading]       = useState(true)
  const realtimeChannel             = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // ── Carrega dados do WatermelonDB ──────────────────────────
  useEffect(() => {
    if (!tenantId) return

    const stageSub = kanbanStagesCollection
      .query(Q.where('tenant_id', tenantId), Q.sortBy('position', Q.asc))
      .observe()
      .subscribe(async (stageList) => {
        setStages(stageList)

        // Para cada stage, busca os cards ordenados por posição
        const map: Record<string, KanbanCard[]> = {}
        await Promise.all(stageList.map(async (stage) => {
          const cards = await kanbanCardsCollection
            .query(Q.where('stage_id', stage.id), Q.sortBy('position', Q.asc))
            .fetch()
          map[stage.id] = cards
        }))
        setCards(map)
        setLoading(false)
      })

    return () => stageSub.unsubscribe()
  }, [tenantId])

  // ── Supabase Realtime — sync em tempo real ─────────────────
  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel(`kanban:${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_cards', filter: `tenant_id=eq.${tenantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any
            // Encontra a stage local correspondente ao server_id
            const [localStage] = await kanbanStagesCollection
              .query(Q.where('server_id', row.stage_id))
              .fetch()
            if (!localStage) return

            // Upsert no WatermelonDB
            const [existing] = await kanbanCardsCollection
              .query(Q.where('server_id', row.id))
              .fetch()

            await database.write(async () => {
              if (existing) {
                await existing.update(r => {
                  r.stageId       = localStage.id
                  r.stageServerId = row.stage_id
                  r.title         = row.title
                  r.description   = row.description
                  r.priority      = row.priority
                  r.position      = row.position
                  r.dueDate       = row.due_date
                  r.assigneeId    = row.assignee_id
                  r.productId     = row.product_id
                  r.synced        = true
                  r.syncedAt      = Date.now()
                })
              } else {
                await kanbanCardsCollection.create(r => {
                  r.serverId      = row.id
                  r.tenantId      = row.tenant_id
                  r.stageId       = localStage.id
                  r.stageServerId = row.stage_id
                  r.title         = row.title
                  r.description   = row.description
                  r.priority      = row.priority ?? 'medium'
                  r.position      = row.position ?? 0
                  r.dueDate       = row.due_date
                  r.assigneeId    = row.assignee_id
                  r.productId     = row.product_id
                  r.synced        = true
                  r.syncedAt      = Date.now()
                })
              }
            })
          }

          if (payload.eventType === 'DELETE') {
            const [local] = await kanbanCardsCollection
              .query(Q.where('server_id', payload.old.id))
              .fetch()
            if (local) {
              await database.write(async () => {
                await local.destroyPermanently()
              })
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kanban_stages', filter: `tenant_id=eq.${tenantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any
            const [existing] = await kanbanStagesCollection
              .query(Q.where('server_id', row.id))
              .fetch()
            await database.write(async () => {
              if (existing) {
                await existing.update(r => {
                  r.name       = row.name
                  r.color      = row.color
                  r.position   = row.position
                  r.isTerminal = row.is_terminal
                  r.syncedAt   = Date.now()
                })
              } else {
                await kanbanStagesCollection.create(r => {
                  r.serverId   = row.id
                  r.tenantId   = row.tenant_id
                  r.name       = row.name
                  r.color      = row.color
                  r.position   = row.position
                  r.isTerminal = row.is_terminal
                  r.syncedAt   = Date.now()
                })
              }
            })
          }
        },
      )
      .subscribe()

    realtimeChannel.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [tenantId])

  // ── Sincronização inicial do Kanban ────────────────────────
  useEffect(() => {
    if (!tenantId) return
    syncKanbanFromServer()
  }, [tenantId])

  async function syncKanbanFromServer() {
    if (!tenantId) return
    const [stagesRes, cardsRes] = await Promise.all([
      supabase.from('kanban_stages').select('*').eq('tenant_id', tenantId),
      supabase.from('kanban_cards').select('*').eq('tenant_id', tenantId),
    ])

    await database.write(async () => {
      for (const row of stagesRes.data ?? []) {
        const [existing] = await kanbanStagesCollection
          .query(Q.where('server_id', row.id))
          .fetch()
        if (!existing) {
          await kanbanStagesCollection.create(r => {
            r.serverId   = row.id
            r.tenantId   = row.tenant_id
            r.name       = row.name
            r.color      = row.color
            r.position   = row.position
            r.isTerminal = row.is_terminal
            r.syncedAt   = Date.now()
          })
        }
      }

      for (const row of cardsRes.data ?? []) {
        const [localStage] = await kanbanStagesCollection
          .query(Q.where('server_id', row.stage_id))
          .fetch()
        if (!localStage) continue

        const [existing] = await kanbanCardsCollection
          .query(Q.where('server_id', row.id))
          .fetch()
        if (!existing) {
          await kanbanCardsCollection.create(r => {
            r.serverId      = row.id
            r.tenantId      = row.tenant_id
            r.stageId       = localStage.id
            r.stageServerId = row.stage_id
            r.title         = row.title
            r.description   = row.description
            r.priority      = row.priority ?? 'medium'
            r.position      = row.position ?? 0
            r.dueDate       = row.due_date
            r.assigneeId    = row.assignee_id
            r.productId     = row.product_id
            r.synced        = true
            r.syncedAt      = Date.now()
          })
        }
      }
    })
  }

  // ── Mover card entre/dentro de colunas ───────────────────
  const moveCard = useCallback(async (
    card:           KanbanCard,
    targetStage:    KanbanStage,
    beforeCard:     KanbanCard | null,
    afterCard:      KanbanCard | null,
  ) => {
    const newPosition = positionBetween(
      beforeCard?.position ?? null,
      afterCard?.position  ?? null,
    )

    // Atualização otimista local
    await card.moveToStage(targetStage.id, targetStage.serverId, newPosition)

    // Sync com Supabase (se card e stage tiverem server_id)
    if (card.serverId && targetStage.serverId) {
      const { error } = await supabase
        .from('kanban_cards')
        .update({ stage_id: targetStage.serverId, position: newPosition })
        .eq('id', card.serverId)

      if (error) console.error('[Kanban] Move error:', error.message)
      else {
        await database.write(async () => {
          await card.update(r => { r.synced = true })
        })
      }
    }
  }, [])

  // ── Criar novo card ────────────────────────────────────────
  const createCard = useCallback(async (params: {
    stageLocalId:   string
    title:          string
    description?:   string
    priority?:      string
    productLocalId?: string
    dueDate?:       string
  }) => {
    if (!tenantId || !profile?.id) return

    const [stage] = await kanbanStagesCollection
      .query(Q.where('id', params.stageLocalId))
      .fetch()
    if (!stage) return

    // Posição no final da coluna
    const existingCards = cardsByStage[params.stageLocalId] ?? []
    const lastPos       = existingCards.at(-1)?.position ?? 0
    const newPosition   = lastPos + 1

    let localCardId = ''
    await database.write(async () => {
      const card = await kanbanCardsCollection.create(r => {
        r.tenantId      = tenantId
        r.stageId       = params.stageLocalId
        r.stageServerId = stage.serverId
        r.title         = params.title
        r.description   = params.description ?? null
        r.priority      = params.priority ?? 'medium'
        r.position      = newPosition
        r.dueDate       = params.dueDate ?? null
        r.productId     = params.productLocalId ?? null
        r.synced        = false
      })
      localCardId = card.id
    })

    // Sync imediata com Supabase
    if (stage.serverId) {
      const { data, error } = await supabase
        .from('kanban_cards')
        .insert({
          tenant_id:   tenantId,
          stage_id:    stage.serverId,
          title:       params.title,
          description: params.description,
          priority:    params.priority ?? 'medium',
          position:    newPosition,
          due_date:    params.dueDate,
        })
        .select()
        .single()

      if (!error && data) {
        const [local] = await kanbanCardsCollection
          .query(Q.where('id', localCardId))
          .fetch()
        if (local) await local.markSynced(data.id)
      }
    }
  }, [tenantId, profile?.id, cardsByStage])

  return { stages, cardsByStage, loading, moveCard, createCard }
}
