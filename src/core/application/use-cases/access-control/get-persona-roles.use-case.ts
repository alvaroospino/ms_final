import { AccessControlRepository, PersonaRoleRecord } from "@/core/domain/repositories/access-control.repository.js";

export class GetPersonaRolesUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(idPersona: string): Promise<PersonaRoleRecord[]> {
    return this.repository.getRolesByPersonaId(idPersona);
  }
}