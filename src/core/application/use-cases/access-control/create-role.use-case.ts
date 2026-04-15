import { DuplicateCodeError } from "../errors/access-control-errors.js";
import { ValidationError } from "../errors/application-errors.js";
import {
  AccessControlRepository,
  RoleRecord,
} from "../../../domain/repositories/access-control.repository.js";

export interface CreateRoleInput {
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  esSistema?: boolean;
}

export class CreateRoleUseCase {
  constructor(private readonly repository: AccessControlRepository) {}

  async execute(input: CreateRoleInput): Promise<RoleRecord> {
    const codigo = input.codigo.trim().toUpperCase();
    const nombre = input.nombre.trim();
    const descripcion = input.descripcion?.trim() ? input.descripcion.trim() : null;

    const issues = [];

    if (!codigo) issues.push({ field: "codigo", message: "El c�digo es obligatorio" });
    if (!nombre) issues.push({ field: "nombre", message: "El nombre es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    const existing = await this.repository.getAllRoles();
    if (existing.some((rol) => rol.codigo === codigo)) {
      throw new DuplicateCodeError("Ya existe un rol con ese c�digo");
    }

    return this.repository.createRole({
      codigo,
      nombre,
      descripcion,
      esSistema: input.esSistema ?? false,
    });
  }
}
