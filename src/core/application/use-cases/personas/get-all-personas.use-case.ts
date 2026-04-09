import { Persona } from "@/core/domain/entities/persona.entity.js";
import { PersonaRepository } from "@/core/domain/repositories/persona.repository.js";

export class GetAllPersonasUseCase {
  constructor(private readonly repository: PersonaRepository) {}

  async execute(): Promise<Persona[]> {
    return this.repository.findAll();
  }
}