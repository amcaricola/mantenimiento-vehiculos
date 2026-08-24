import { z } from 'zod'
import { TIPOS_REVISION } from '../../../shared/types'

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (esperado YYYY-MM-DD)')

export const itemRevisionInputSchema = z.object({
  id: z.string().min(1).optional(),
  tipo: z.enum(TIPOS_REVISION),
  nombre: z.string().min(1, 'El nombre de la revisión es obligatorio'),
  fechaProximaRevision: isoDateSchema.optional(),
  kilometrajeActual: z.number().nonnegative().optional(),
  kilometrajeProximo: z.number().nonnegative().optional(),
  imagenRespaldoUrl: z.string().nullable().optional(),
  observaciones: z.string().optional(),
})

export const vehiculoInputSchema = z.object({
  patente: z
    .string()
    .min(2, 'La patente es obligatoria')
    .max(10, 'La patente es demasiado larga')
    .transform((v) => v.trim().toUpperCase().replace(/\s+/g, '')),
  marca: z.string().min(1, 'La marca es obligatoria'),
  modelo: z.string().min(1, 'El modelo es obligatorio'),
  tipo: z.string().min(1, 'El tipo es obligatorio'),
  fechaUltimaRevision: isoDateSchema.optional(),
  revisiones: z.array(itemRevisionInputSchema).default([]),
})

export const vehiculoUpdateSchema = vehiculoInputSchema.partial()

export type VehiculoInput = z.infer<typeof vehiculoInputSchema>
export type VehiculoUpdateInput = z.infer<typeof vehiculoUpdateSchema>
export type ItemRevisionInput = z.infer<typeof itemRevisionInputSchema>