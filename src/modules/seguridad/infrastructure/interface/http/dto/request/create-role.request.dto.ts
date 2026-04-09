import { z } from "zod";

export const createRoleRequestSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  esSistema: z.boolean().optional(),
});

export type CreateRoleRequestDto = z.infer<typeof createRoleRequestSchema>;