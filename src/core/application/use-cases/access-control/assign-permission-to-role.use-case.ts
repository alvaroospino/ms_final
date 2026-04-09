import {
  DuplicateAssignmentError,
  EntityNotFoundError,
} from "@/core/application/use-cases/errors/access-control-errors.js";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import { AccessControlRepository } from "@/core/domain/repositories/access-control.repository.js";

export interface AssignPermissionToRoleInput {
  idRol: string;
  idPermiso: string;
}

export class AssignPermissionToRoleUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(input: AssignPermissionToRoleInput): Promise<{ success: true }> {
    const issues = [];

    if (!input.idRol?.trim()) {
      issues.push({ field: "idRol", message: "El idRol es obligatorio" });
    }

    if (!input.idPermiso?.trim()) {
      issues.push({ field: "idPermiso", message: "El idPermiso es obligatorio" });
    }

    if (issues.length) throw new ValidationError(issues);

    const roleExists = await this.repository.roleExists(input.idRol);
    if (!roleExists) throw new EntityNotFoundError("El rol no existe");

    const permissionExists = await this.repository.permissionExists(input.idPermiso);
    if (!permissionExists) throw new EntityNotFoundError("El permiso no existe");

    const alreadyAssigned = await this.repository.permissionAlreadyAssignedToRole(
      input.idRol,
      input.idPermiso,
    );

    if (alreadyAssigned) {
      throw new DuplicateAssignmentError("Ese permiso ya está asignado al rol");
    }

    await this.repository.assignPermissionToRole({
      idRol: input.idRol,
      idPermiso: input.idPermiso,
    });

    return { success: true };
  }
}