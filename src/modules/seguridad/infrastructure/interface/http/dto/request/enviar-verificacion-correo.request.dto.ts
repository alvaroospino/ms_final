import { z } from "zod";

export const enviarVerificacionCorreoRequestSchema = z.object({});

export type EnviarVerificacionCorreoRequestDto = z.infer<typeof enviarVerificacionCorreoRequestSchema>;
