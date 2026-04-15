import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { DatabaseError } from "../../../../../core/application/use-cases/errors/application-errors.js";
import {
  CrearRegistroPendienteParams,
  RegistroPendienteRecord,
  RegistroPendienteRepository,
  TipoIdentificadorAcceso,
} from "../../../../../core/domain/repositories/registro-pendiente.repository.js";
import { registrosPendientes } from "../persona.schema.js";
import { db } from "../../../../../shared/database/connection.js";

export class RegistroPendienteDrizzleRepository implements RegistroPendienteRepository {
  async upsert(params: CrearRegistroPendienteParams): Promise<RegistroPendienteRecord> {
    const ahora = new Date();

    try {
      const existing = await this.findActivoByIdentificador(params.identificador);

      if (existing) {
        const rows = await db
          .update(registrosPendientes)
          .set({
            tipoIdentificador: params.tipoIdentificador,
            hashCodigo: params.hashCodigo,
            intentos: 0,
            verificado: 0,
            completado: 0,
            fechaExpiracion: params.fechaExpiracion,
            fechaVerificacion: null,
            fechaActualizacion: ahora,
          })
          .where(eq(registrosPendientes.id, existing.id))
          .returning();

        return this.map(rows[0]);
      }

      const rows = await db
        .insert(registrosPendientes)
        .values({
          id: randomUUID(),
          tipoIdentificador: params.tipoIdentificador,
          identificador: params.identificador,
          hashCodigo: params.hashCodigo,
          intentos: 0,
          verificado: 0,
          completado: 0,
          fechaExpiracion: params.fechaExpiracion,
          fechaVerificacion: null,
          fechaCreacion: ahora,
          fechaActualizacion: ahora,
        })
        .returning();

      return this.map(rows[0]);
    } catch (error) {
      throw new DatabaseError("No fue posible guardar el registro pendiente", error);
    }
  }

  async findActivoByIdentificador(identificador: string): Promise<RegistroPendienteRecord | null> {
    try {
      const rows = await db
        .select()
        .from(registrosPendientes)
        .where(
          and(
            eq(registrosPendientes.identificador, identificador),
            eq(registrosPendientes.completado, 0),
          ),
        )
        .limit(1);

      const row = rows[0];
      return row ? this.map(row) : null;
    } catch (error) {
      throw new DatabaseError("No fue posible consultar el registro pendiente", error);
    }
  }

  async incrementarIntentos(id: string): Promise<number> {
    try {
      const actual = await db
        .select({ intentos: registrosPendientes.intentos })
        .from(registrosPendientes)
        .where(eq(registrosPendientes.id, id))
        .limit(1);

      const nuevosIntentos = (actual[0]?.intentos ?? 0) + 1;

      await db
        .update(registrosPendientes)
        .set({
          intentos: nuevosIntentos,
          fechaActualizacion: new Date(),
        })
        .where(eq(registrosPendientes.id, id));

      return nuevosIntentos;
    } catch (error) {
      throw new DatabaseError("No fue posible actualizar intentos del registro pendiente", error);
    }
  }

  async marcarVerificado(id: string): Promise<void> {
    try {
      await db
        .update(registrosPendientes)
        .set({
          verificado: 1,
          fechaVerificacion: new Date(),
          fechaActualizacion: new Date(),
        })
        .where(eq(registrosPendientes.id, id));
    } catch (error) {
      throw new DatabaseError("No fue posible marcar verificado el registro pendiente", error);
    }
  }

  async marcarCompletado(id: string): Promise<void> {
    try {
      await db
        .update(registrosPendientes)
        .set({
          completado: 1,
          fechaActualizacion: new Date(),
        })
        .where(eq(registrosPendientes.id, id));
    } catch (error) {
      throw new DatabaseError("No fue posible completar el registro pendiente", error);
    }
  }

  private map(row: typeof registrosPendientes.$inferSelect): RegistroPendienteRecord {
    return {
      id: row.id,
      tipoIdentificador: row.tipoIdentificador as TipoIdentificadorAcceso,
      identificador: row.identificador,
      hashCodigo: row.hashCodigo,
      intentos: row.intentos,
      verificado: row.verificado === 1,
      completado: row.completado === 1,
      fechaExpiracion: row.fechaExpiracion,
      fechaVerificacion: row.fechaVerificacion ?? null,
      fechaCreacion: row.fechaCreacion,
      fechaActualizacion: row.fechaActualizacion,
    };
  }
}
