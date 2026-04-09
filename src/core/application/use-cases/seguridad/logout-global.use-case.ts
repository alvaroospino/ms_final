import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";
import { AuditoriaRepository } from "@/core/domain/repositories/auditoria.repository.js";

export interface LogoutGlobalInput {
  idPersona: string;
  idAutenticacion: string;
  ip?: string | null;
  agenteUsuario?: string | null;
}

export class LogoutGlobalUseCase {
  constructor(
    private readonly personaRepo: PersonaRepository,
    private readonly auditoriaRepo: AuditoriaRepository,
  ) {}

  async execute(input: LogoutGlobalInput): Promise<{ success: true; sesionesRevocadas: number }> {
    // Obtener sesiones activas antes de revocar para el conteo
    const sesiones = await this.personaRepo.findSessionsByPersonaId(input.idPersona);
    const activas = sesiones.filter((s) => s.activa).length;

    await this.personaRepo.revocarTodosLosRefreshTokens(input.idPersona);
    await this.personaRepo.cerrarTodosLosIngresos(input.idPersona);

    await this.auditoriaRepo.registrar({
      idPersona: input.idPersona,
      idAutenticacion: input.idAutenticacion,
      evento: "logout_global",
      ip: input.ip,
      agenteUsuario: input.agenteUsuario,
      detalle: { sesionesRevocadas: activas },
    });

    return { success: true, sesionesRevocadas: activas };
  }
}
