import { z } from "zod";

export const logoutRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutRequestDto = z.infer<typeof logoutRequestSchema>;