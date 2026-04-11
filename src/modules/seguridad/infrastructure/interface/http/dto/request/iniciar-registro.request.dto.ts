import { z } from "zod";

export const iniciarRegistroRequestSchema = z.object({
  identificador: z.string().trim().min(1),
});

export type IniciarRegistroRequestDto = z.infer<typeof iniciarRegistroRequestSchema>;
