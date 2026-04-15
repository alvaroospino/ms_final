import { Persona } from "../../../domain/entities/persona.entity.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";

export class GetAllPersonasUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(): Promise<Persona[]> {
    return this.repository.findAll();
  }
}
