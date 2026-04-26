import { z } from "zod";

export const verificarCodigoLoginRequestSchema = z.object({
  identificador: z.string().trim().min(1),
  codigo: z.string().trim().min(1),
});

export type VerificarCodigoLoginRequestDto = z.infer<typeof verificarCodigoLoginRequestSchema>;
