import { z } from "zod";

export const solicitarRecuperacionClaveRequestSchema = z.object({
  correo: z.string().email("El correo debe tener formato válido"),
});

export type SolicitarRecuperacionClaveRequestDto = z.infer<typeof solicitarRecuperacionClaveRequestSchema>;
