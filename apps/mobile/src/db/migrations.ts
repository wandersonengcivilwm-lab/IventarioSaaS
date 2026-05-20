import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        createTable({
          name: 'kanban_stages',
          columns: [
            { name: 'server_id',   type: 'string',  isOptional: true },
            { name: 'tenant_id',   type: 'string' },
            { name: 'name',        type: 'string' },
            { name: 'color',       type: 'string' },
            { name: 'position',    type: 'number' },
            { name: 'is_terminal', type: 'boolean' },
            { name: 'synced_at',   type: 'number',  isOptional: true },
            { name: 'created_at',  type: 'number' },
          ],
        }),
        createTable({
          name: 'kanban_cards',
          columns: [
            { name: 'server_id',       type: 'string',  isOptional: true },
            { name: 'tenant_id',       type: 'string' },
            { name: 'stage_id',        type: 'string' },
            { name: 'stage_server_id', type: 'string',  isOptional: true },
            { name: 'product_id',      type: 'string',  isOptional: true },
            { name: 'title',           type: 'string' },
            { name: 'description',     type: 'string',  isOptional: true },
            { name: 'quantity',        type: 'number',  isOptional: true },
            { name: 'priority',        type: 'string' },
            { name: 'due_date',        type: 'string',  isOptional: true },
            { name: 'assignee_id',     type: 'string',  isOptional: true },
            { name: 'position',        type: 'number' },
            { name: 'synced',          type: 'boolean' },
            { name: 'synced_at',       type: 'number',  isOptional: true },
            { name: 'created_at',      type: 'number' },
            { name: 'updated_at',      type: 'number' },
          ],
        }),
      ],
    },
  ],
})
