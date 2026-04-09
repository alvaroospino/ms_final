import { DuplicateCodeError } from "@/core/application/use-cases/errors/access-control-errors.js";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import {
  AccessControlRepository,
  PermissionRecord,
} from "@/core/domain/repositories/access-control.repository.js";

export interface CreatePermissionInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
}

export class CreatePermissionUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(input: CreatePermissionInput): Promise<PermissionRecord> {
    const codigo = input.codigo.trim();
    const nombre = input.nombre.trim();
    const descripcion = input.descripcion?.trim() ? input.descripcion.trim() : null;

    const issues = [];

    if (!codigo) issues.push({ field: "codigo", message: "El código es obligatorio" });
    if (!nombre) issues.push({ field: "nombre", message: "El nombre es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    const existing = await this.repository.getAllPermissions();
    if (existing.some((permiso) => permiso.codigo === codigo)) {
      throw new DuplicateCodeError("Ya existe un permiso con ese código");
    }

    return this.repository.createPermission({
      codigo,
      nombre,
      descripcion,
    });
  }
}