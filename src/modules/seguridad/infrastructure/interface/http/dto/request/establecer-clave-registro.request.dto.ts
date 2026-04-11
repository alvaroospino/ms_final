import { z } from "zod";

export const establecerClaveRegistroRequestSchema = z.object({
  identificador: z.string().trim().min(1),
  clave: z.string().min(8),
});

export type EstablecerClaveRegistroRequestDto = z.infer<
  typeof establecerClaveRegistroRequestSchema
>;
