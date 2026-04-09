import { EntityNotFoundError } from "@/core/application/use-cases/errors/access-control-errors.js";
import { PersonaRepository, SessionDetailRecord } from "@/core/domain/repositories/persona.repository.js";

export class GetMySessionDetailUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(idIngreso: number, idPersona: string): Promise<SessionDetailRecord> {
    const session = await this.repository.findSessionByIdAndPersonaId(idIngreso, idPersona);

    if (!session) {
      throw new EntityNotFoundError("La sesión no existe o no pertenece al usuario");
    }

    return session;
  }
}