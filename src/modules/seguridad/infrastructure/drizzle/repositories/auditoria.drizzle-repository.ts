import { sql } from "drizzle-orm";
import {
  AuditoriaRepository,
  RegistrarEventoParams,
} from "@/core/domain/repositories/auditoria.repository.js";
import { auditoria } from "@/modules/seguridad/infrastructure/drizzle/persona.schema.js";
import { db } from "@/shared/database/connection.js";

export class AuditoriaDrizzleRepository implements AuditoriaRepository {
  async registrar(params: RegistrarEventoParams): Promise<void> {
    try {
      await db.insert(auditoria).values({
        id: sql`DEFAULT`,
        idPersona: params.idPersona ?? null,
        idAutenticacion: params.idAutenticacion ?? null,
        idIngreso: params.idIngreso ?? null,
        evento: params.evento,
        ip: params.ip ?? null,
        agenteUsuario: params.agenteUsuario ?? null,
        detalle: params.detalle ? JSON.stringify(params.detalle) : null,
        fecha: new Date(),
      });
    } catch {
      // La auditoría nunca debe romper el flujo principal
    }
  }
}
