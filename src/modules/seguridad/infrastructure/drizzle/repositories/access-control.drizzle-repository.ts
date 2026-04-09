import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { DatabaseError } from "@/core/application/use-cases/errors/application-errors.js";
import {
  AccessControlRepository,
  AssignPermissionToRoleParams,
  AssignRoleToPersonaParams,
  CreatePermissionParams,
  CreateRoleParams,
  PermissionRecord,
  PersonaRoleRecord,
  RolePermissionRecord,
  RoleRecord,
} from "@/core/domain/repositories/access-control.repository.js";
import {
  permisos,
  personas,
  personasRoles,
  roles,
  rolesPermisos,
} from "@/modules/seguridad/infrastructure/drizzle/persona.schema.js";
import { db } from "@/shared/database/connection.js";

export class AccessControlDrizzleRepository implements AccessControlRepository {
  async createRole(params: CreateRoleParams): Promise<RoleRecord> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.insert(roles).values({
        id,
        codigo: params.codigo,
        nombre: params.nombre,
        descripcion: params.descripcion ?? null,
        esSistema: params.esSistema ? 1 : 0,
        fechaCreacion: now,
        fechaActualizacion: now,
      });

      return {
        id,
        codigo: params.codigo,
        nombre: params.nombre,
        descripcion: params.descripcion ?? null,
        esSistema: params.esSistema ?? false,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible crear el rol", error);
    }
  }

  async createPermission(params: CreatePermissionParams): Promise<PermissionRecord> {
    try {
      const id = randomUUID();
      const now = new Date();

      await db.insert(permisos).values({
        id,
        codigo: params.codigo,
        nombre: params.nombre,
        descripcion: params.descripcion ?? null,
        fechaCreacion: now,
        fechaActualizacion: now,
      });

      return {
        id,
        codigo: params.codigo,
        nombre: params.nombre,
        descripcion: params.descripcion ?? null,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible crear el permiso", error);
    }
  }

  async assignRoleToPersona(params: AssignRoleToPersonaParams): Promise<void> {
    try {
      await db.insert(personasRoles).values({
        idPersona: params.idPersona,
        idRol: params.idRol,
        idPersonaAutoriza: params.idPersonaAutoriza ?? null,
        fechaAsignacion: new Date(),
      });
    } catch (error) {
      throw new DatabaseError("No fue posible asignar el rol a la persona", error);
    }
  }

  async assignPermissionToRole(params: AssignPermissionToRoleParams): Promise<void> {
    try {
      await db.insert(rolesPermisos).values({
        idRol: params.idRol,
        idPermiso: params.idPermiso,
        fechaAsignacion: new Date(),
      });
    } catch (error) {
      throw new DatabaseError("No fue posible asignar el permiso al rol", error);
    }
  }

  async removeRoleFromPersona(idPersona: string, idRol: string): Promise<void> {
    try {
      await db
        .delete(personasRoles)
        .where(and(eq(personasRoles.idPersona, idPersona), eq(personasRoles.idRol, idRol)));
    } catch (error) {
      throw new DatabaseError("No fue posible quitar el rol de la persona", error);
    }
  }

  async removePermissionFromRole(idRol: string, idPermiso: string): Promise<void> {
    try {
      await db
        .delete(rolesPermisos)
        .where(and(eq(rolesPermisos.idRol, idRol), eq(rolesPermisos.idPermiso, idPermiso)));
    } catch (error) {
      throw new DatabaseError("No fue posible quitar el permiso del rol", error);
    }
  }

  async getAllRoles(): Promise<RoleRecord[]> {
    try {
      const rows = await db.select().from(roles);

      return rows.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        descripcion: row.descripcion ?? null,
        esSistema: row.esSistema === 1,
      }));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar los roles", error);
    }
  }

  async getAllPermissions(): Promise<PermissionRecord[]> {
    try {
      const rows = await db.select().from(permisos);

      return rows.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
        descripcion: row.descripcion ?? null,
      }));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar los permisos", error);
    }
  }

  async getRolesByPersonaId(idPersona: string): Promise<PersonaRoleRecord[]> {
    try {
      const rows = await db
        .select({
          id: roles.id,
          codigo: roles.codigo,
          nombre: roles.nombre,
        })
        .from(personasRoles)
        .innerJoin(roles, eq(personasRoles.idRol, roles.id))
        .where(eq(personasRoles.idPersona, idPersona));

      return rows.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
      }));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar los roles de la persona", error);
    }
  }

  async getPermissionsByRoleId(idRol: string): Promise<RolePermissionRecord[]> {
    try {
      const rows = await db
        .select({
          id: permisos.id,
          codigo: permisos.codigo,
          nombre: permisos.nombre,
        })
        .from(rolesPermisos)
        .innerJoin(permisos, eq(rolesPermisos.idPermiso, permisos.id))
        .where(eq(rolesPermisos.idRol, idRol));

      return rows.map((row) => ({
        id: row.id,
        codigo: row.codigo,
        nombre: row.nombre,
      }));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar los permisos del rol", error);
    }
  }

  async roleExists(idRol: string): Promise<boolean> {
    const rows = await db.select({ id: roles.id }).from(roles).where(eq(roles.id, idRol)).limit(1);
    return !!rows[0];
  }

  async permissionExists(idPermiso: string): Promise<boolean> {
    const rows = await db
      .select({ id: permisos.id })
      .from(permisos)
      .where(eq(permisos.id, idPermiso))
      .limit(1);

    return !!rows[0];
  }

  async personaExists(idPersona: string): Promise<boolean> {
    const rows = await db
      .select({ id: personas.id })
      .from(personas)
      .where(eq(personas.id, idPersona))
      .limit(1);

    return !!rows[0];
  }

  async roleAlreadyAssignedToPersona(idPersona: string, idRol: string): Promise<boolean> {
    const rows = await db
      .select({ idPersona: personasRoles.idPersona })
      .from(personasRoles)
      .where(and(eq(personasRoles.idPersona, idPersona), eq(personasRoles.idRol, idRol)))
      .limit(1);

    return !!rows[0];
  }

  async permissionAlreadyAssignedToRole(idRol: string, idPermiso: string): Promise<boolean> {
    const rows = await db
      .select({ idRol: rolesPermisos.idRol })
      .from(rolesPermisos)
      .where(and(eq(rolesPermisos.idRol, idRol), eq(rolesPermisos.idPermiso, idPermiso)))
      .limit(1);

    return !!rows[0];
  }
}