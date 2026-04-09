import { z } from "zod";

export const assignPermissionToRoleRequestSchema = z.object({
  idPermiso: z.string().uuid(),
});

export type AssignPermissionToRoleRequestDto = z.infer<typeof assignPermissionToRoleRequestSchema>;