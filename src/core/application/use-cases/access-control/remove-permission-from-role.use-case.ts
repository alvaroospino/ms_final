import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { AccessControlRepository } from "@/core/domain/repositories/access-control.repository.js";

export class RemovePermissionFromRoleUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(idRol: string, idPermiso: string): Promise<{ success: true }> {
    const issues = [];

    if (!idRol?.trim()) issues.push({ field: "idRol", message: "El idRol es obligatorio" });
    if (!idPermiso?.trim()) issues.push({ field: "idPermiso", message: "El idPermiso es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    await this.repository.removePermissionFromRole(idRol, idPermiso);
    return { success: true };
  }
}