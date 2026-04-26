import { z } from "zod";

export const solicitarCodigoLoginRequestSchema = z.object({
  identificador: z.string().trim().min(1),
});

export type SolicitarCodigoLoginRequestDto = z.infer<typeof solicitarCodigoLoginRequestSchema>;
