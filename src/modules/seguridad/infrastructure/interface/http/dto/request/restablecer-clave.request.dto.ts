import { z } from "zod";

export const restablecerClaveRequestSchema = z.object({
  correo: z.string().email("El correo debe tener formato válido"),
  codigo: z.string().min(1, "El código es obligatorio"),
  nuevaClave: z.string().min(8, "La nueva clave debe tener al menos 8 caracteres"),
});

export type RestablecerClaveRequestDto = z.infer<typeof restablecerClaveRequestSchema>;
