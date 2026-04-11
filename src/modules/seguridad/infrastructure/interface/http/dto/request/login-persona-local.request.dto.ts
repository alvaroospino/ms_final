import { z } from "zod";

export const loginPersonaLocalRequestSchema = z.object({
  identificador: z.string().trim().min(1),
  clave: z.string().min(1),
});

export type LoginPersonaLocalRequestDto = z.infer<typeof loginPersonaLocalRequestSchema>;
