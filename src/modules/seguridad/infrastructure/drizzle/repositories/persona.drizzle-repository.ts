import { and, count, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { PersonaAlreadyExistsError } from "@/core/application/use-cases/errors/persona-errors.js";

import { DatabaseError } from "@/core/application/use-cases/errors/application-errors.js";
import { Persona } from "@/core/domain/entities/persona.entity.js";
import {
  AutenticacionLocalRecord,
  GuardarRefreshTokenParams,
  PersonaRepository,
  RegistrarIngresoParams,
  RegistrarIngresoResult,
  RegistrarPersonaLocalParams,
  RegistroPersonaLocalResult,
  RefreshTokenSessionRecord,
  RevocarRefreshTokenParams,
  SessionDetailRecord,
  SessionRecord,
} from "@/core/domain/repositories/persona.repository.js";
import { CorreoElectronico } from "@/core/domain/value-objects/correo-electronico.value-object.js";
import {
  autenticacionesPersona,
  ingresos,
  personas,
  tokensRefresco,
  roles,
  permisos,
  personasRoles,
  rolesPermisos
} from "@/modules/seguridad/infrastructure/drizzle/persona.schema.js";
import { db } from "@/shared/database/connection.js";

export class PersonaDrizzleRepository implements PersonaRepository {
  async findAll(): Promise<Persona[]> {
    try {
      const rows = await db.select().from(personas);
      return rows.map((row) => this.mapPersona(row));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar las personas", error);
    }
  }

  async count(): Promise<number> {
    try {
      const result = await db.select({ total: count() }).from(personas);
      return Number(result[0]?.total ?? 0);
    } catch (error) {
      throw new DatabaseError("No fue posible contar las personas", error);
    }
  }

  async findByCorreo(correo: string): Promise<Persona | null> {
    try {
      const rows = await db
        .select()
        .from(personas)
        .where(eq(personas.correo, correo))
        .limit(1);
      const row = rows[0];
      return row ? this.mapPersona(row) : null;
    } catch (error) {
      throw new DatabaseError(
        "No fue posible consultar la persona por correo",
        error,
      );
    }
  }

  async registrarLocal(
    params: RegistrarPersonaLocalParams,
  ): Promise<RegistroPersonaLocalResult> {
    const personaId = randomUUID();
    const autenticacionId = randomUUID();
    const ahora = new Date();

    try {
      const personaCreada = await db.transaction(async (tx) => {
        const personaRows = await tx
          .insert(personas)
          .values({
            id: personaId,
            nombres: params.nombres,
            apellidos: params.apellidos,
            correo: params.correo,
            celular: params.celular ?? null,
            estado: 1,
            fechaEliminacion: null,
            fechaCreacion: ahora,
            fechaActualizacion: ahora,
          })
          .returning();

        await tx.insert(autenticacionesPersona).values({
          id: autenticacionId,
          idPersona: personaId,
          proveedor: "local",
          identificadorExterno: null,
          hashClave: params.hashClave,
          verificado: 0,
          estado: 1,
          requiereCambioClave: 0,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          ultimoIngreso: null,
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        });

        return personaRows[0];
      });

      return {
        persona: this.mapPersona(personaCreada),
        autenticacion: {
          id: autenticacionId,
          proveedor: "local",
          verificado: false,
          estado: 1,
          requiereCambioClave: false,
        },
      };
    } catch (error: unknown) {
      const pgError = error as { code?: string };

      if (pgError.code === "23505") {
        throw new PersonaAlreadyExistsError();
      }

      throw new DatabaseError(
        "No fue posible registrar la persona con autenticación local",
        error,
      );
    }
  }

  async findAutenticacionLocalByCorreo(
    correo: string,
  ): Promise<AutenticacionLocalRecord | null> {
    try {
      const rows = await db
        .select({
          authId: autenticacionesPersona.id,
          authIdPersona: autenticacionesPersona.idPersona,
          hashClave: autenticacionesPersona.hashClave,
          verificado: autenticacionesPersona.verificado,
          estado: autenticacionesPersona.estado,
          intentosFallidos: autenticacionesPersona.intentosFallidos,
          bloqueadoHasta: autenticacionesPersona.bloqueadoHasta,
          ultimoIngreso: autenticacionesPersona.ultimoIngreso,

          personaId: personas.id,
          personaNombres: personas.nombres,
          personaApellidos: personas.apellidos,
          personaCorreo: personas.correo,
          personaCelular: personas.celular,
          personaEstado: personas.estado,
          personaFechaCreacion: personas.fechaCreacion,
          personaFechaActualizacion: personas.fechaActualizacion,
        })
        .from(autenticacionesPersona)
        .innerJoin(personas, eq(autenticacionesPersona.idPersona, personas.id))
        .where(
          and(
            eq(personas.correo, correo),
            eq(autenticacionesPersona.proveedor, "local"),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row || !row.hashClave) return null;

      return {
        id: row.authId,
        idPersona: row.authIdPersona,
        correo: row.personaCorreo,
        hashClave: row.hashClave,
        verificado: row.verificado === 1,
        estado: row.estado,
        intentosFallidos: row.intentosFallidos,
        bloqueadoHasta: row.bloqueadoHasta,
        ultimoIngreso: row.ultimoIngreso,
        persona: new Persona(
          row.personaId,
          row.personaNombres,
          row.personaApellidos,
          new CorreoElectronico(row.personaCorreo),
          row.personaCelular ?? null,
          row.personaEstado,
          row.personaFechaCreacion,
          row.personaFechaActualizacion,
        ),
      };
    } catch (error) {
      throw new DatabaseError(
        "No fue posible consultar la autenticación local",
        error,
      );
    }
  }

  async findAutenticacionById(idAutenticacion: string): Promise<AutenticacionLocalRecord | null> {
    try {
      const rows = await db
        .select({
          authId: autenticacionesPersona.id,
          authIdPersona: autenticacionesPersona.idPersona,
          hashClave: autenticacionesPersona.hashClave,
          verificado: autenticacionesPersona.verificado,
          estado: autenticacionesPersona.estado,
          intentosFallidos: autenticacionesPersona.intentosFallidos,
          bloqueadoHasta: autenticacionesPersona.bloqueadoHasta,
          ultimoIngreso: autenticacionesPersona.ultimoIngreso,
          personaId: personas.id,
          personaNombres: personas.nombres,
          personaApellidos: personas.apellidos,
          personaCorreo: personas.correo,
          personaCelular: personas.celular,
          personaEstado: personas.estado,
          personaFechaCreacion: personas.fechaCreacion,
          personaFechaActualizacion: personas.fechaActualizacion,
        })
        .from(autenticacionesPersona)
        .innerJoin(personas, eq(autenticacionesPersona.idPersona, personas.id))
        .where(eq(autenticacionesPersona.id, idAutenticacion))
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      return {
        id: row.authId,
        idPersona: row.authIdPersona,
        correo: row.personaCorreo,
        hashClave: row.hashClave ?? "",
        verificado: row.verificado === 1,
        estado: row.estado,
        intentosFallidos: row.intentosFallidos,
        bloqueadoHasta: row.bloqueadoHasta,
        ultimoIngreso: row.ultimoIngreso,
        persona: new Persona(
          row.personaId,
          row.personaNombres,
          row.personaApellidos,
          new CorreoElectronico(row.personaCorreo),
          row.personaCelular ?? null,
          row.personaEstado,
          row.personaFechaCreacion,
          row.personaFechaActualizacion,
        ),
      };
    } catch (error) {
      throw new DatabaseError("No fue posible consultar la autenticación por id", error);
    }
  }

  async marcarCorreoVerificado(idAutenticacion: string): Promise<void> {
    try {
      await db
        .update(autenticacionesPersona)
        .set({ verificado: 1, fechaActualizacion: new Date() })
        .where(eq(autenticacionesPersona.id, idAutenticacion));
    } catch (error) {
      throw new DatabaseError("No fue posible marcar el correo como verificado", error);
    }
  }

  async cambiarClave(idAutenticacion: string, hashClave: string): Promise<void> {
    try {
      await db
        .update(autenticacionesPersona)
        .set({
          hashClave,
          requiereCambioClave: 0,
          intentosFallidos: 0,
          bloqueadoHasta: null,
          fechaActualizacion: new Date(),
        })
        .where(eq(autenticacionesPersona.id, idAutenticacion));
    } catch (error) {
      throw new DatabaseError("No fue posible cambiar la clave", error);
    }
  }

  async revocarTodosLosRefreshTokens(idPersona: string): Promise<void> {
    try {
      // Obtener todos los ingresos activos de la persona
      const ingresosPersona = await db
        .select({ id: ingresos.id })
        .from(ingresos)
        .innerJoin(autenticacionesPersona, eq(ingresos.idAutenticacion, autenticacionesPersona.id))
        .where(eq(autenticacionesPersona.idPersona, idPersona));

      const idIngresos = ingresosPersona.map((i) => i.id);
      if (idIngresos.length === 0) return;

      await db
        .update(tokensRefresco)
        .set({ estado: 0, fechaRevocacion: new Date() })
        .where(
          and(
            sql`${tokensRefresco.idIngreso} = ANY(${sql.raw(`ARRAY[${idIngresos.join(",")}]::bigint[]`)})`,
            eq(tokensRefresco.estado, 1),
          ),
        );
    } catch (error) {
      throw new DatabaseError("No fue posible revocar los refresh tokens", error);
    }
  }

  async cerrarTodosLosIngresos(idPersona: string): Promise<void> {
    try {
      const ingresosPersona = await db
        .select({ id: ingresos.id })
        .from(ingresos)
        .innerJoin(autenticacionesPersona, eq(ingresos.idAutenticacion, autenticacionesPersona.id))
        .where(
          and(
            eq(autenticacionesPersona.idPersona, idPersona),
            sql`${ingresos.fechaFin} IS NULL`,
          ),
        );

      const idIngresos = ingresosPersona.map((i) => i.id);
      if (idIngresos.length === 0) return;

      await db
        .update(ingresos)
        .set({ fechaFin: new Date() })
        .where(
          sql`${ingresos.id} = ANY(${sql.raw(`ARRAY[${idIngresos.join(",")}]::bigint[]`)})`,
        );
    } catch (error) {
      throw new DatabaseError("No fue posible cerrar los ingresos", error);
    }
  }

  async incrementarIntentosFallidos(idAutenticacion: string): Promise<number> {
    try {
      const actual = await db
        .select({ intentos: autenticacionesPersona.intentosFallidos })
        .from(autenticacionesPersona)
        .where(eq(autenticacionesPersona.id, idAutenticacion))
        .limit(1);

      const intentosActuales = actual[0]?.intentos ?? 0;
      const nuevosIntentos = intentosActuales + 1;

      await db
        .update(autenticacionesPersona)
        .set({
          intentosFallidos: nuevosIntentos,
          fechaActualizacion: new Date(),
        })
        .where(eq(autenticacionesPersona.id, idAutenticacion));

      return nuevosIntentos;
    } catch (error) {
      throw new DatabaseError(
        "No fue posible incrementar intentos fallidos",
        error,
      );
    }
  }

  async reiniciarIntentosFallidosYActualizarIngreso(
    idAutenticacion: string,
  ): Promise<void> {
    try {
      await db
        .update(autenticacionesPersona)
        .set({
          intentosFallidos: 0,
          bloqueadoHasta: null,
          ultimoIngreso: new Date(),
          fechaActualizacion: new Date(),
        })
        .where(eq(autenticacionesPersona.id, idAutenticacion));
    } catch (error) {
      throw new DatabaseError(
        "No fue posible actualizar el ingreso de autenticación",
        error,
      );
    }
  }

  async bloquearAutenticacion(
    idAutenticacion: string,
    bloqueadoHasta: Date,
  ): Promise<void> {
    try {
      await db
        .update(autenticacionesPersona)
        .set({
          bloqueadoHasta,
          fechaActualizacion: new Date(),
        })
        .where(eq(autenticacionesPersona.id, idAutenticacion));
    } catch (error) {
      throw new DatabaseError(
        "No fue posible bloquear la autenticación",
        error,
      );
    }
  }

  async registrarIngreso(
    params: RegistrarIngresoParams,
  ): Promise<RegistrarIngresoResult> {
    try {
      const ahora = new Date();

      const result = await db
        .insert(ingresos)
        .values({
          id: sql`DEFAULT`,
          idAutenticacion: params.idAutenticacion ?? null,
          resultado: params.resultado,
          ip: params.ip ?? null,
          agenteUsuario: params.agenteUsuario ?? null,
          dispositivo: params.dispositivo ?? null,
          fechaInicio: ahora,
          fechaFin: null,
        })
        .returning({ id: ingresos.id });

      return {
        idIngreso: Number(result[0].id),
        fechaInicio: ahora,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible registrar el ingreso", error);
    }
  }

  async guardarRefreshToken(params: GuardarRefreshTokenParams): Promise<void> {
    try {
      await db.insert(tokensRefresco).values({
        id: sql`DEFAULT`,
        idIngreso: params.idIngreso,
        hashToken: params.tokenHash,
        estado: 1,
        fechaRevocacion: null,
        fechaCreacion: new Date(),
      });
    } catch (error) {
      throw new DatabaseError("No fue posible guardar el refresh token", error);
    }
  }

  private mapPersona(row: typeof personas.$inferSelect): Persona {
    return new Persona(
      row.id,
      row.nombres,
      row.apellidos,
      new CorreoElectronico(row.correo),
      row.celular ?? null,
      row.estado,
      row.fechaCreacion,
      row.fechaActualizacion,
    );
  }

  async findRefreshTokenSessionByHash(
    tokenHash: string,
  ): Promise<RefreshTokenSessionRecord | null> {
    try {
      const rows = await db
        .select({
          tokenId: tokensRefresco.id,
          tokenIdIngreso: tokensRefresco.idIngreso,
          tokenEstado: tokensRefresco.estado,
          tokenFechaRevocacion: tokensRefresco.fechaRevocacion,

          ingresoIdAutenticacion: ingresos.idAutenticacion,

          authId: autenticacionesPersona.id,
          authIdPersona: autenticacionesPersona.idPersona,

          personaId: personas.id,
          personaNombres: personas.nombres,
          personaApellidos: personas.apellidos,
          personaCorreo: personas.correo,
          personaCelular: personas.celular,
          personaEstado: personas.estado,
          personaFechaCreacion: personas.fechaCreacion,
          personaFechaActualizacion: personas.fechaActualizacion,
        })
        .from(tokensRefresco)
        .innerJoin(ingresos, eq(tokensRefresco.idIngreso, ingresos.id))
        .innerJoin(
          autenticacionesPersona,
          eq(ingresos.idAutenticacion, autenticacionesPersona.id),
        )
        .innerJoin(personas, eq(autenticacionesPersona.idPersona, personas.id))
        .where(eq(tokensRefresco.hashToken, tokenHash))
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      return {
        idToken: Number(row.tokenId),
        idIngreso: Number(row.tokenIdIngreso),
        idAutenticacion: row.authId,
        idPersona: row.personaId,
        correo: row.personaCorreo,
        estadoToken: row.tokenEstado,
        fechaRevocacion: row.tokenFechaRevocacion,
        persona: new Persona(
          row.personaId,
          row.personaNombres,
          row.personaApellidos,
          new CorreoElectronico(row.personaCorreo),
          row.personaCelular ?? null,
          row.personaEstado,
          row.personaFechaCreacion,
          row.personaFechaActualizacion,
        ),
      };
    } catch (error) {
      throw new DatabaseError(
        "No fue posible consultar el refresh token",
        error,
      );
    }
  }

  async revocarRefreshToken(params: RevocarRefreshTokenParams): Promise<void> {
    try {
      await db
        .update(tokensRefresco)
        .set({
          estado: 0,
          fechaRevocacion: new Date(),
        })
        .where(eq(tokensRefresco.id, params.idToken));
    } catch (error) {
      throw new DatabaseError("No fue posible revocar el refresh token", error);
    }
  }

  async cerrarIngreso(idIngreso: number): Promise<void> {
    try {
      await db
        .update(ingresos)
        .set({
          fechaFin: new Date(),
        })
        .where(eq(ingresos.id, idIngreso));
    } catch (error) {
      throw new DatabaseError("No fue posible cerrar el ingreso", error);
    }
  }

  async findRolesByPersonaId(
    idPersona: string,
  ): Promise<{ id: string; nombre: string }[]> {
    try {
      const rows = await db
        .select({
          id: roles.id,
          nombre: roles.codigo,
        })
        .from(personasRoles)
        .innerJoin(roles, eq(personasRoles.idRol, roles.id))
        .where(eq(personasRoles.idPersona, idPersona));

      return rows.map((row) => ({
        id: row.id,
        nombre: row.nombre,
      }));
    } catch (error) {
      throw new DatabaseError(
        "No fue posible consultar los roles de la persona",
        error,
      );
    }
  }

  async findPermisosByPersonaId(
    idPersona: string,
  ): Promise<{ id: string; nombre: string }[]> {
    try {
      const rows = await db
        .select({
          id: permisos.id,
          nombre: permisos.codigo,
        })
        .from(personasRoles)
        .innerJoin(roles, eq(personasRoles.idRol, roles.id))
        .innerJoin(rolesPermisos, eq(roles.id, rolesPermisos.idRol))
        .innerJoin(permisos, eq(rolesPermisos.idPermiso, permisos.id))
        .where(eq(personasRoles.idPersona, idPersona));

      const unique = new Map<string, { id: string; nombre: string }>();

      for (const row of rows) {
        unique.set(row.id, {
          id: row.id,
          nombre: row.nombre,
        });
      }

      return Array.from(unique.values());
    } catch (error) {
      throw new DatabaseError(
        "No fue posible consultar los permisos de la persona",
        error,
      );
    }
  }

    async findSessionsByPersonaId(idPersona: string): Promise<SessionRecord[]> {
    try {
      const rows = await db
        .select({
          idIngreso: ingresos.id,
          idAutenticacion: ingresos.idAutenticacion,
          resultado: ingresos.resultado,
          ip: ingresos.ip,
          agenteUsuario: ingresos.agenteUsuario,
          dispositivo: ingresos.dispositivo,
          fechaInicio: ingresos.fechaInicio,
          fechaFin: ingresos.fechaFin,
        })
        .from(ingresos)
        .innerJoin(
          autenticacionesPersona,
          eq(ingresos.idAutenticacion, autenticacionesPersona.id),
        )
        .where(eq(autenticacionesPersona.idPersona, idPersona))
        .orderBy(sql`${ingresos.fechaInicio} DESC`);

      return rows.map((row) => ({
        idIngreso: Number(row.idIngreso),
        idAutenticacion: row.idAutenticacion ?? null,
        resultado: row.resultado,
        ip: row.ip ?? null,
        agenteUsuario: row.agenteUsuario ?? null,
        dispositivo: row.dispositivo ?? null,
        fechaInicio: row.fechaInicio,
        fechaFin: row.fechaFin ?? null,
        activa: row.fechaFin === null,
      }));
    } catch (error) {
      throw new DatabaseError("No fue posible consultar las sesiones de la persona", error);
    }
  }

  async findSessionByIdAndPersonaId(
    idIngreso: number,
    idPersona: string,
  ): Promise<SessionDetailRecord | null> {
    try {
      const rows = await db
        .select({
          idIngreso: ingresos.id,
          idAutenticacion: ingresos.idAutenticacion,
          resultado: ingresos.resultado,
          ip: ingresos.ip,
          agenteUsuario: ingresos.agenteUsuario,
          dispositivo: ingresos.dispositivo,
          fechaInicio: ingresos.fechaInicio,
          fechaFin: ingresos.fechaFin,
          personaId: personas.id,
          personaCorreo: personas.correo,
        })
        .from(ingresos)
        .innerJoin(
          autenticacionesPersona,
          eq(ingresos.idAutenticacion, autenticacionesPersona.id),
        )
        .innerJoin(personas, eq(autenticacionesPersona.idPersona, personas.id))
        .where(
          and(
            eq(ingresos.id, idIngreso),
            eq(personas.id, idPersona),
          ),
        )
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      return {
        idIngreso: Number(row.idIngreso),
        idAutenticacion: row.idAutenticacion ?? null,
        resultado: row.resultado,
        ip: row.ip ?? null,
        agenteUsuario: row.agenteUsuario ?? null,
        dispositivo: row.dispositivo ?? null,
        fechaInicio: row.fechaInicio,
        fechaFin: row.fechaFin ?? null,
        activa: row.fechaFin === null,
        idPersona: row.personaId,
        correo: row.personaCorreo,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible consultar el detalle de la sesión", error);
    }
  }
}
