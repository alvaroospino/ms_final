import { z } from "zod";

export const createPermissionRequestSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
});

export type CreatePermissionRequestDto = z.infer<typeof createPermissionRequestSchema>;