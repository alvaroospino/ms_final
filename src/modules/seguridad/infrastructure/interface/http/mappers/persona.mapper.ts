import { Persona } from "@/core/domain/entities/persona.entity.js";
import { PersonaResponseDto } from "@/modules/seguridad/infrastructure/interface/http/dto/response/persona.response.dto.js";

export class PersonaMapper {
  static toResponse(entity: Persona): PersonaResponseDto {
    return {
      id: entity.id,
      nombres: entity.nombres,
      apellidos: entity.apellidos,
      nombreCompleto: entity.nombreCompleto,
      correo: entity.correo.toString(),
      celular: entity.celular,
      estado: entity.estado,
      activa: entity.estaActiva(),
      fechaCreacion: entity.fechaCreacion.toISOString(),
      fechaActualizacion: entity.fechaActualizacion.toISOString(),
    };
  }
}