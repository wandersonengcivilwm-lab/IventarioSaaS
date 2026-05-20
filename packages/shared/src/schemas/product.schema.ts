import { z } from 'zod'

export const createProductSchema = z.object({
  name:        z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  sku:         z.string().max(50).optional().nullable(),
  barcode:     z.string().max(50).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  unit:        z.enum(['un','kg','g','l','ml','m','cx','pct']),
  cost_price:  z.number().nonnegative().optional().nullable(),
  sale_price:  z.number().nonnegative().optional().nullable(),
  min_stock:   z.number().int().nonnegative().default(0),
  description: z.string().max(500).optional().nullable(),
})

export const createCategorySchema = z.object({
  name:  z.string().min(2).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').default('#A8C8E8'),
  icon:  z.string().max(50).optional().nullable(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
