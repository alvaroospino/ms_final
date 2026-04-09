import { z } from "zod";

export const assignRoleToPersonaRequestSchema = z.object({
  idRol: z.string().uuid(),
  idPersonaAutoriza: z.string().uuid().optional().nullable(),
});

export type AssignRoleToPersonaRequestDto = z.infer<typeof assignRoleToPersonaRequestSchema>;