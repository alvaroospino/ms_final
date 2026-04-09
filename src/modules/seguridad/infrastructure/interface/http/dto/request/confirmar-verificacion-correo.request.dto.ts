import { z } from "zod";

export const confirmarVerificacionCorreoRequestSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
});

export type ConfirmarVerificacionCorreoRequestDto = z.infer<typeof confirmarVerificacionCorreoRequestSchema>;
