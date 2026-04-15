import { PersonaRepository, SessionRecord } from "../../../domain/repositories/persona.repository.js";

export class GetMySessionsUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(idPersona: string): Promise<SessionRecord[]> {
    return this.repository.findSessionsByPersonaId(idPersona);
  }
}
