import { and, eq, sql } from "drizzle-orm";
import { DatabaseError } from "@/core/application/use-cases/errors/application-errors.js";
import {
  CodigoRecord,
  CodigoVerificacionRepository,
  CrearCodigoParams,
  TipoCodigo,
} from "@/core/domain/repositories/codigo-verificacion.repository.js";
import { codigosVerificacion } from "@/modules/seguridad/infrastructure/drizzle/persona.schema.js";
import { db } from "@/shared/database/connection.js";

export class CodigoVerificacionDrizzleRepository implements CodigoVerificacionRepository {
  async crearCodigo(params: CrearCodigoParams): Promise<CodigoRecord> {
    try {
      const ahora = new Date();
      const rows = await db
        .insert(codigosVerificacion)
        .values({
          id: sql`DEFAULT`,
          idAutenticacion: params.idAutenticacion,
          tipo: params.tipo,
          hashCodigo: params.hashCodigo,
          estado: 0,
          intentos: 0,
          fechaExpiracion: params.fechaExpiracion,
          fechaUso: null,
          fechaCreacion: ahora,
        })
        .returning();

      const row = rows[0];
      return {
        id: Number(row.id),
        idAutenticacion: row.idAutenticacion,
        tipo: row.tipo as TipoCodigo,
        hashCodigo: row.hashCodigo,
        estado: row.estado,
        intentos: row.intentos,
        fechaExpiracion: row.fechaExpiracion,
        fechaUso: row.fechaUso ?? null,
        fechaCreacion: row.fechaCreacion,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible crear el código de verificación", error);
    }
  }

  async findCodigoActivoByAutenticacionAndTipo(
    idAutenticacion: string,
    tipo: TipoCodigo,
  ): Promise<CodigoRecord | null> {
    try {
      const rows = await db
        .select()
        .from(codigosVerificacion)
        .where(
          and(
            eq(codigosVerificacion.idAutenticacion, idAutenticacion),
            eq(codigosVerificacion.tipo, tipo),
            eq(codigosVerificacion.estado, 0),
          ),
        )
        .orderBy(sql`${codigosVerificacion.fechaCreacion} DESC`)
        .limit(1);

      const row = rows[0];
      if (!row) return null;

      return {
        id: Number(row.id),
        idAutenticacion: row.idAutenticacion,
        tipo: row.tipo as TipoCodigo,
        hashCodigo: row.hashCodigo,
        estado: row.estado,
        intentos: row.intentos,
        fechaExpiracion: row.fechaExpiracion,
        fechaUso: row.fechaUso ?? null,
        fechaCreacion: row.fechaCreacion,
      };
    } catch (error) {
      throw new DatabaseError("No fue posible consultar el código de verificación", error);
    }
  }

  async incrementarIntentosCodigo(idCodigo: number): Promise<number> {
    try {
      const actual = await db
        .select({ intentos: codigosVerificacion.intentos })
        .from(codigosVerificacion)
        .where(eq(codigosVerificacion.id, idCodigo))
        .limit(1);

      const nuevosIntentos = (actual[0]?.intentos ?? 0) + 1;

      await db
        .update(codigosVerificacion)
        .set({ intentos: nuevosIntentos })
        .where(eq(codigosVerificacion.id, idCodigo));

      return nuevosIntentos;
    } catch (error) {
      throw new DatabaseError("No fue posible incrementar intentos del código", error);
    }
  }

  async marcarCodigoUsado(idCodigo: number): Promise<void> {
    try {
      await db
        .update(codigosVerificacion)
        .set({ estado: 1, fechaUso: new Date() })
        .where(eq(codigosVerificacion.id, idCodigo));
    } catch (error) {
      throw new DatabaseError("No fue posible marcar el código como usado", error);
    }
  }

  async invalidarCodigosAnteriores(idAutenticacion: string, tipo: TipoCodigo): Promise<void> {
    try {
      await db
        .update(codigosVerificacion)
        .set({ estado: 2 })
        .where(
          and(
            eq(codigosVerificacion.idAutenticacion, idAutenticacion),
            eq(codigosVerificacion.tipo, tipo),
            eq(codigosVerificacion.estado, 0),
          ),
        );
    } catch (error) {
      throw new DatabaseError("No fue posible invalidar códigos anteriores", error);
    }
  }
}
