import { DuplicateCodeError } from "@/core/application/use-cases/errors/access-control-errors.js";
import { ValidationError } from "@/core/application/use-cases/errors/application-errors.js";
import {
  AccessControlRepository,
  RoleRecord,
} from "@/core/domain/repositories/access-control.repository.js";

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

    if (!codigo) issues.push({ field: "codigo", message: "El código es obligatorio" });
    if (!nombre) issues.push({ field: "nombre", message: "El nombre es obligatorio" });

    if (issues.length) throw new ValidationError(issues);

    const existing = await this.repository.getAllRoles();
    if (existing.some((rol) => rol.codigo === codigo)) {
      throw new DuplicateCodeError("Ya existe un rol con ese código");
    }

    return this.repository.createRole({
      codigo,
      nombre,
      descripcion,
      esSistema: input.esSistema ?? false,
    });
  }
}