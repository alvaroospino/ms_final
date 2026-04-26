import { NotFoundError } from "../errors/application-errors.js";
import { PersonaRepository } from "../../../domain/repositories/persona.repository.js";

export class GetPersonaByIdUseCase {
  constructor(private readonly personaRepo: PersonaRepository) {}

  async execute(idPersona: string) {
    const auth = await this.personaRepo.findAutenticacionByPersonaId(idPersona);

    if (!auth) {
      throw new NotFoundError("Persona no encontrada");
    }

    const roles = await this.personaRepo.findRolesByPersonaId(idPersona);
    const permisos = await this.personaRepo.findPermisosByPersonaId(idPersona);

    return {
      id: auth.persona.id,
      nombres: auth.persona.nombres,
      apellidos: auth.persona.apellidos,
      nombreCompleto: auth.persona.nombreCompleto || null,
      correo: auth.persona.correo,
      celular: auth.persona.celular,
      identificador: auth.identificador,
      tipoIdentificador: auth.tipoIdentificador,
      verificado: auth.verificado,
      estado: auth.persona.estado,
      activa: auth.persona.estaActiva(),
      ultimoIngreso: auth.ultimoIngreso ? auth.ultimoIngreso.toISOString() : null,
      roles: roles.map((r) => r.nombre),
      permisos: permisos.map((p) => p.nombre),
      fechaCreacion: auth.persona.fechaCreacion.toISOString(),
      fechaActualizacion: auth.persona.fechaActualizacion.toISOString(),
    };
  }
}
