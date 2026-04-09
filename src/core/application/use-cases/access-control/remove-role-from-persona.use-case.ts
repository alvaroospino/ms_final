import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { AccessControlRepository } from "@/core/domain/repositories/access-control.repository.js";

export class RemoveRoleFromPersonaUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(idPersona: string, idRol: string): Promise<{ success: true }> {
    const issues = [];

    if (!idPersona?.trim()) issues.push({ field: "idPersona", message: "El idPersona es obligatorio" });
    if (!idRol?.trim()) issues.push({ field: "idRol", message: "El idRol es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    await this.repository.removeRoleFromPersona(idPersona, idRol);
    return { success: true };
  }
}