import { z } from "zod";

export const verificarRegistroRequestSchema = z.object({
  identificador: z.string().trim().min(1),
  codigo: z.string().trim().min(1),
});

export type VerificarRegistroRequestDto = z.infer<typeof verificarRegistroRequestSchema>;
