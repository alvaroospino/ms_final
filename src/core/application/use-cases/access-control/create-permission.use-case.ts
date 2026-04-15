import { DuplicateCodeError } from "../errors/access-control-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import {
  AccessControlRepository,
  PermissionRecord,
} from "../../../domain/repositories/access-control.repository.js";

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

    if (!codigo) issues.push({ field: "codigo", message: "El c�digo es obligatorio" });
    if (!nombre) issues.push({ field: "nombre", message: "El nombre es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    const existing = await this.repository.getAllPermissions();
    if (existing.some((permiso) => permiso.codigo === codigo)) {
      throw new DuplicateCodeError("Ya existe un permiso con ese c�digo");
    }

    return this.repository.createPermission({
      codigo,
      nombre,
      descripcion,
    });
  }
}
