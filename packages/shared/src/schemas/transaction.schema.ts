import { z } from 'zod'

export const createTransactionSchema = z.object({
  product_id:     z.string().uuid(),
  warehouse_id:   z.string().uuid(),
  type:           z.enum(['entry','exit','adjustment','transfer_in','transfer_out']),
  quantity:       z.number().positive('Quantidade deve ser maior que zero'),
  unit_cost:      z.number().nonnegative().optional().nullable(),
  reference:      z.string().max(100).optional().nullable(),
  notes:          z.string().max(500).optional().nullable(),
  scanned_via_qr: z.boolean().default(false),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
