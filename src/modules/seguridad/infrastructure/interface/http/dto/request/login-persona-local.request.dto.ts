import { z } from "zod";

export const loginPersonaLocalRequestSchema = z.object({
  correo: z.string().trim().toLowerCase().email(),
  clave: z.string().min(1),
});

export type LoginPersonaLocalRequestDto = z.infer<typeof loginPersonaLocalRequestSchema>;