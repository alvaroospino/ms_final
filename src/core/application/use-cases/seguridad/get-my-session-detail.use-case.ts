import { EntityNotFoundError } from "../errors/access-control-errors.js";
import { PersonaRepository, SessionDetailRecord } from "../../../domain/repositories/persona.repository.js";

export class GetMySessionDetailUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(idIngreso: number, idPersona: string): Promise<SessionDetailRecord> {
    const session = await this.repository.findSessionByIdAndPersonaId(idIngreso, idPersona);

    if (!session) {
      throw new EntityNotFoundError("La sesi�n no existe o no pertenece al usuario");
    }

    return session;
  }
}
