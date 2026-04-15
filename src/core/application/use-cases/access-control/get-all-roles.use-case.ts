import { AccessControlRepository, RoleRecord } from "../../../domain/repositories/access-control.repository.js";

export class GetAllRolesUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(): Promise<RoleRecord[]> {
    return this.repository.getAllRoles();
  }
}
