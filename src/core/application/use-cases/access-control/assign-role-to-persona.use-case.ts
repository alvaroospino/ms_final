import {
  DuplicateAssignmentError,
  EntityNotFoundError,
} from "../errors/access-control-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import { AccessControlRepository } from "../../../domain/repositories/access-control.repository.js";

export interface AssignRoleToPersonaInput {
  idPersona: string;
  idRol: string;
  idPersonaAutoriza?: string | null;
}

export class AssignRoleToPersonaUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(input: AssignRoleToPersonaInput): Promise<{ success: true }> {
    const issues = [];

    if (!input.idPersona?.trim()) {
      issues.push({ field: "idPersona", message: "El idPersona es obligatorio" });
    }

    if (!input.idRol?.trim()) {
      issues.push({ field: "idRol", message: "El idRol es obligatorio" });
    }

    if (issues.length) throw new ValidationError(issues);

    const personaExists = await this.repository.personaExists(input.idPersona);
    if (!personaExists) throw new EntityNotFoundError("La persona no existe");

    const roleExists = await this.repository.roleExists(input.idRol);
    if (!roleExists) throw new EntityNotFoundError("El rol no existe");

    const alreadyAssigned = await this.repository.roleAlreadyAssignedToPersona(
      input.idPersona,
      input.idRol,
    );

    if (alreadyAssigned) {
      throw new DuplicateAssignmentError("Ese rol ya est� asignado a la persona");
    }

    await this.repository.assignRoleToPersona({
      idPersona: input.idPersona,
      idRol: input.idRol,
      idPersonaAutoriza: input.idPersonaAutoriza ?? null,
    });

    return { success: true };
  }
}
