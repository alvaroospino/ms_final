import {
  AccessControlRepository,
  PermissionRecord,
} from "@/core/domain/repositories/access-control.repository.js";

export class GetAllPermissionsUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(): Promise<PermissionRecord[]> {
    return this.repository.getAllPermissions();
  }
}