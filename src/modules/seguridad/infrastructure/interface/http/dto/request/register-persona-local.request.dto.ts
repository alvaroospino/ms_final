import { z } from "zod";

export const registerPersonaLocalRequestSchema = z.object({
  nombres: z.string().trim().min(2),
  apellidos: z.string().trim().min(2),
  correo: z.string().trim().toLowerCase().email(),
  celular: z.string().trim().max(20).optional().nullable(),
  clave: z.string().min(8),
});

export type RegisterPersonaLocalRequestDto = z.infer<typeof registerPersonaLocalRequestSchema>;