import { z } from "zod";

export const cambiarClaveRequestSchema = z.object({
  claveActual: z.string().min(1, "La clave actual es obligatoria"),
  nuevaClave: z.string().min(8, "La nueva clave debe tener al menos 8 caracteres"),
});

export type CambiarClaveRequestDto = z.infer<typeof cambiarClaveRequestSchema>;
