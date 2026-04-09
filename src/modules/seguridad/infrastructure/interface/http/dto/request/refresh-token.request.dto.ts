import { z } from "zod";

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenRequestDto = z.infer<typeof refreshTokenRequestSchema>;