import {
  AccessControlRepository,
  RolePermissionRecord,
} from "@/core/domain/repositories/access-control.repository.js";

export class GetRolePermissionsUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(idRol: string): Promise<RolePermissionRecord[]> {
    return this.repository.getPermissionsByRoleId(idRol);
  }
}