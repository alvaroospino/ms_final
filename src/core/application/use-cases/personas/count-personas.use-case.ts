import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";

export class CountPersonasUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(): Promise<number> {
    return this.repository.count();
  }
}
